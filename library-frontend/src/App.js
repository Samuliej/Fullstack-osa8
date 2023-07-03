import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import LoginForm from './components/LoginForm'
import Notification from './components/Notification'
import { useEffect, useState } from 'react'
import {
  Link,
  Route,
  BrowserRouter as Router,
  Routes
} from 'react-router-dom'
import { useApolloClient } from '@apollo/client'

const App = () => {
  const [errorMessage, setErrorMessage] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [token, setToken] = useState(null)
  const client = useApolloClient()

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

  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
  }

  return (
    <Router>
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
            <Link>
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
          <Route path='/authors' element={<Authors setError={setErrorMessage} setNotif={setNotifMessage} /> } />
          <Route path='/books' element={<Books />} />
          <Route path='/addBook' element={<NewBook setError={setErrorMessage} setNotif={setNotifMessage}/>} />
          <Route path='/login' element={<LoginForm setToken={setToken} setError={setErrorMessage} setNotif={setNotifMessage} />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
