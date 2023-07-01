const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const { GraphQLError } = require( 'graphql' )
const { v4: uuid4 }  = require('uuid')

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



let authors = [
  {
    name: 'Robert Martin',
    id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
    born: 1952,
  },
  {
    name: 'Martin Fowler',
    id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
    born: 1963
  },
  {
    name: 'Fyodor Dostoevsky',
    id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
    born: 1821
  },
  {
    name: 'Joshua Kerievsky', // birthyear not known
    id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
  },
  {
    name: 'Sandi Metz', // birthyear not known
    id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
  },
]

let books = [
  {
    title: 'Clean Code',
    published: 2008,
    author: 'Robert Martin',
    id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Agile software development',
    published: 2002,
    author: 'Robert Martin',
    id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
    genres: ['agile', 'patterns', 'design']
  },
  {
    title: 'Refactoring, edition 2',
    published: 2018,
    author: 'Martin Fowler',
    id: "afa5de00-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Refactoring to patterns',
    published: 2008,
    author: 'Joshua Kerievsky',
    id: "afa5de01-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'patterns']
  },
  {
    title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
    published: 2012,
    author: 'Sandi Metz',
    id: "afa5de02-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'design']
  },
  {
    title: 'Crime and punishment',
    published: 1866,
    author: 'Fyodor Dostoevsky',
    id: "afa5de03-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'crime']
  },
  {
    title: 'The Demon ',
    published: 1872,
    author: 'Fyodor Dostoevsky',
    id: "afa5de04-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'revolution']
  },
]

const typeDefs = `

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
  }
`

const resolvers = {
  Query: {
    bookCount: async () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {
      if (args.length === 0) return await Book.find({})
      const { author, genre } = args
      const authorObj = await Author.findOne({ name: author })

      const filterByAuthor = (author) => (books) => books.filter(book => book.author.equals(author._id))
      const filterByGenre = (genre) => (books) => books.filter(book => book.genres.includes(genre))

      const authorFilter = authorObj ? filterByAuthor(authorObj) : (books) => books
      const genreFilter = genre ? filterByGenre(genre) : (books) => books
      const allBooks = await Book.find({})
      console.log('all books', allBooks)
      const filteredBooks = authorFilter(genreFilter(allBooks))

      return filteredBooks
    },
    allAuthors: async () => {
      return await Author.find({})
    }
  },
  Mutation: {
    addBook: async (root, args) => {
      let book
      let author
      try {
        author = await Author.findOne({ name: args.author })

        if (!author) {
          author = new Author({ name: args.author, born: null })
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
        book = new Book({ ...args, author: author._id })
        await book.save()
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