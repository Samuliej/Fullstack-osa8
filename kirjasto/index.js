const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { GraphQLError } = require( 'graphql' )
const jwt = require('jsonwebtoken')

const mongoose = require('mongoose')
mongoose.set('strictQuery', false)
const Book = require('./models/Book')
const Author = require('./models/Author')

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
      const allBooks = await Book.find({})

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
    addBook: async (root, args) => {
      let book
      let author
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

    editAuthor: async (root, args) => {
      const { name, setBornTo } = args
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
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers
})

startStandaloneServer(server, {
  listen: { port: 4000 },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`)
})