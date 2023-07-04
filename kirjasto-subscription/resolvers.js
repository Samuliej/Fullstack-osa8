const { GraphQLError } = require( 'graphql' )
const Book = require('./models/Book')
const Author = require('./models/Author')
const jwt = require('jsonwebtoken')
const User = require('./models/User')
const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub()

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
      /*
      kysely   query {
                allAuthors {
                  name
                  bookCount
                }
              }

              Aiheuttaa vain yhden console.log() backendissä
      */
      console.log('kysely')
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
          // Uudelle authorille bookCount alustetaan nollaksi
          author = new Author({ name: args.author, born: null, bookCount: 0, books: [args.title] })
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
        // Book count päivitetään backendissä joten allAuthors query ei aiheuta n+1 kyselyä
        await Author.updateOne({ _id: author._id }, { bookCount: author.bookCount + 1, books: [...author.books, args.title] })
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

      pubsub.publish('BOOK_ADDED', { bookAdded: book })
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
      const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre })

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
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator('BOOK_ADDED')
    }
  }
}

module.exports = resolvers