const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { GraphQLError } = require( 'graphql' )
const jwt = require('jsonwebtoken')

const mongoose = require('mongoose')
mongoose.set('strictQuery', false)
const Book = require('./models/Book')
const Author = require('./models/Author')
const User = require('./models/User')

require('dotenv').config()

const MONGODB_URI = process.env.MONGODB_URI

console.log('connecting to ', MONGODB_URI)

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB: ', error)
  })


const typeDefs = `

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Author {
    name: String!
    born: Int
    bookCount: Int!
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(
      author: String
      genre: String
      ): [Book!]!
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]!
    ): Book!
    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
  }
`

const resolvers = {
  Query: {
    bookCount: async () => Book.collection.countDocuments(),
    authorCount: async () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      if (Object.keys(args).length === 0) {
        const books = await Book.find({}).populate('author')
        return books
      }

      const { author, genre } = args
      const authorObj = await Author.findOne({ name: author })

      const filterByAuthor = (author) => (books) => books.filter(book => book.author.equals(author._id))
      const filterByGenre = (genre) => (books) => books.filter(book => book.genres.includes(genre))

      const authorFilter = authorObj ? filterByAuthor(authorObj) : (books) => books
      const genreFilter = genre ? filterByGenre(genre) : (books) => books
      const allBooks = await Book.find({}).populate('author')

      const filteredBooks = authorFilter(genreFilter(allBooks))

      return filteredBooks
    },
    allAuthors: async () => {
      return await Author.find({})
    },
    me: (root, args, context) => {
      return context.currentUser
    }
  },
  Mutation: {
    addBook: async (root, args, context) => {
      let book
      let author

      const currentUser = context.currentUser

      console.log(currentUser)

      if (!currentUser) {
        throw new GraphQLError('not authenticated', {
          extensions: {
            code: 'BAD_USER_INPUT'
          }
        })
      }
      try {
        author = await Author.findOne({ name: args.author })

        if (!author) {
          author = new Author({ name: args.author, born: null, bookCount: 0 })
          await author.save()
        }
      } catch (error) {
        throw new GraphQLError('Something went wrong creating the author', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invaldArgs: args.author,
            error
          }
        })
      }

      try {
        book = new Book({ ...args, author: author })
        await book.save()

        await Author.updateOne({ _id: author._id }, { bookCount: author.bookCount + 1 })
      } catch (error) {
        // Remove the author if the book doesn't get through
        await Author.findByIdAndRemove(author._id)
        throw new GraphQLError('Something went wrong creating the book', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invaligArgs: args.title,
            error
          }
        })
      }
      return book
    },

    editAuthor: async (root, args, context) => {
      const { name, setBornTo } = args

      const currentUser = context.currentUser

      if (!currentUser) {
        throw new GraphQLError('not authenticated', {
          extensions: {
            code: 'BAD_USER_INPUT'
          }
        })
      }

      let authorToUpdate
      try {
        authorToUpdate = await Author.findOne({ name: name })
        console.log(authorToUpdate)
        authorToUpdate.born = setBornTo
        await authorToUpdate.save()
      } catch (error) {
        throw new GraphQLError('Something went wrong updating the author', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: [name, setBornTo],
            error
          }
        })
      }

      return authorToUpdate
    },

    createUser: async (root, args) => {
      const user = new User({ username: args.username })

      try {
        return user.save()
      } catch (error) {
        throw new GraphQLError('Something went wrong creating the user', {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.username,
            error
          }
        })
      }
    },

    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })

      console.log(args.username)
      console.log(args.password)

      if (!user || args.password !== 'salasana') {
        throw new GraphQLError('wrong credentials', {
          extensions: {
            code: 'BAD_USER_INPUT'
          }
        })
      }

      const userForToken = {
        username: user.username,
        id: user._id
      }

      return {
        value: jwt.sign(userForToken, process.env.JWT_SECRET)
      }
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers
})

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req, res }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.startsWith('Bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), process.env.JWT_SECRET
      )

      const currentUser = await User
        .findById(decodedToken.id)

      return { currentUser }
    }
  }
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})