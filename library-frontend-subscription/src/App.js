import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import LoginForm from './components/LoginForm'
import Notification from './components/Notification'
import RecommendBooks from './components/RecommendBooks'
import { ALL_AUTHORS, ALL_BOOKS, BOOK_ADDED } from './queries'
import { useEffect, useState } from 'react'
import {
  Link,
  Route,
  Routes,
  useNavigate
} from 'react-router-dom'
import { useApolloClient, useQuery, useSubscription } from '@apollo/client'

export const updateBookGenreCache = (cache, query, genre, addedBook) => {
  const uniqByTitle = (a) => {
    let seen = new Set()
    return a.filter((item) => {
      let k = item.title
      return seen.has(k) ? false : seen.add(k)
    })
  }

  cache.updateQuery({ query: query, variables: { genre } }, (data) => {
    if (data && data.allBooks) {
      return {
        allBooks: uniqByTitle([...data.allBooks, addedBook])
      }
    }
    return data
  })
}

export const updateBookListCache = (cache, query, addedBook) => {
  const existingBooks = cache.readQuery({ query: query })
  const isDuplicate = existingBooks.allBooks.some(
    book => book.title === addedBook.title
  )

  if (!isDuplicate) {
    const updatedBooks = [...existingBooks.allBooks, addedBook]

    cache.writeQuery({
      query: query,
      data: { allBooks: updatedBooks },
    })
  }
}

export const updateAuthorListCache = (cache, query, addedBook) => {
  const existingAuthors = cache.readQuery({ query: query })
  if (existingAuthors) {
    const existingAuthor = existingAuthors.allAuthors.find(
      author => author.name === addedBook.author.name
    )


    if (existingAuthor) {
      const updatedAuthors = existingAuthors.allAuthors.map(author => {
        if (author.name === existingAuthor.name) {
          return { ...author, bookCount: author.bookCount + 1 }
        }
        return author
      })
      cache.writeQuery({
        query: query,
        data: { allAuthors: updatedAuthors },
      })
    } else {
      const newAuthor = {
        ...addedBook.author,
        bookCount: 1,
      }

      const updatedAuthors = [...existingAuthors.allAuthors, newAuthor]

      cache.writeQuery({
        query: query,
        data: { allAuthors: updatedAuthors },
      })
    }
}

}

const App = () => {
  const [errorMessage, setErrorMessage] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [token, setToken] = useState(null)
  const client = useApolloClient()
  const result = useQuery(ALL_BOOKS)
  const navigate = useNavigate()

  useSubscription(BOOK_ADDED, {
    onData: ({ data }) => {
      const addedBook = data.data.bookAdded
      updateBookGenreCache(client.cache, ALL_BOOKS, '', addedBook)
      updateBookListCache(client.cache, ALL_BOOKS, addedBook)
      updateAuthorListCache(client.cache, ALL_AUTHORS, addedBook)
      alert(`book ${addedBook.title} added`)
    }
  })

  useEffect(() => {
    const userToken = localStorage.getItem('library-user-token')
    if (userToken) {
      setToken(userToken)
    }
  }, [token])

  useEffect(() => {
    if (errorMessage) {
      const timeout = setTimeout(() => {
        setErrorMessage('')
      }, 5000)
      return () => {
        clearTimeout(timeout)
      }
    }
  }, [errorMessage])

  useEffect(() => {
    if (notifMessage) {
      const timeout = setTimeout(() => {
        setNotifMessage('')
      }, 5000)
      return () => {
        clearTimeout(timeout)
      }
    }
  }, [notifMessage])

  if (result.loading) {
    return <div>Books are loading...</div>
  }

  const books = result.data.allBooks

  const logout = () => {
    navigate('/')
    setToken(null)
    localStorage.clear()
    client.resetStore()
  }

  return (
    <div>
      <Notification errorMessage={errorMessage} notifMessage={notifMessage} />
      <div>
        <Link to={'/authors'}>
          <button type='button'>Authors</button>
        </Link>
        <Link to={'/books'}>
          <button type='button'>Books</button>
        </Link>
        {token &&
        <>
          <Link to={'/addBook'}>
            <button type='button'>Add book</button>
          </Link>
          <Link to={'/recommend'}>
            <button type='button'>recommend</button>
          </Link>
          <Link to={'/'}>
            <button onClick={logout}>logout</button>
          </Link>
        </>
        }
        {!token &&
          <Link to={'/login'}>
            <button type='button'>Login</button>
          </Link>
        }
      </div>

      <Routes>
        <Route path='/' element={<Authors setError={setErrorMessage} setNotif={setNotifMessage} /> } />
        <Route path='/authors' element={<Authors setError={setErrorMessage} setNotif={setNotifMessage} /> } />
        <Route path='/books' element={<Books books={books} />} />
        <Route path='/addBook' element={<NewBook setError={setErrorMessage} setNotif={setNotifMessage}/>} />
        <Route path='/login' element={<LoginForm setToken={setToken} setError={setErrorMessage} setNotif={setNotifMessage} />} />
        {token && <Route path='/recommend' element={<RecommendBooks books={books} />} /> }
      </Routes>
    </div>
  )
}

export default App
