import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import {
  Link,
  Route,
  BrowserRouter as Router,
  Routes
} from 'react-router-dom'

const App = () => {
  return (
    <Router>
      <div>
        <div>
          <Link to={'/authors'}>
            <button type='button'>Authors</button>
          </Link>
          <Link to={'/books'}>
            <button type='button'>Books</button>
          </Link>
          <Link to={'/addBook'}>
            <button type='button'>Add book</button>
          </Link>
        </div>

        <Routes>
          <Route path='/authors' element={<Authors />} />
          <Route path='/books' element={<Books />} />
          <Route path='/addBook' element={<NewBook />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
