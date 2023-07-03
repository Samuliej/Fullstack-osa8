import { useQuery } from "@apollo/client"
import { ALL_BOOKS } from "../queries"
import { useState } from "react"

const BookRow = ({ book }) => (
  <tr key={book.title}>
    <td>{book.title}</td>
    <td>{book.author.name}</td>
    <td>{book.published}</td>
  </tr>
)

const Books = () => {
  const [genre, setGenre] = useState('')
  const result = useQuery(ALL_BOOKS)

  if (result.loading) {
    return <div>Books are loading...</div>
  }

  const books = result.data.allBooks
  const uniqueGenres = [...new Set(books.flatMap(book => book.genres))]

  return (
    <div>
      <h2>books</h2>
      in genre <strong>{genre}</strong>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((b) => {
            if (!genre || genre === 'all genres' || b.genres.includes(genre)) {
              return <BookRow key={b.title} book={b} />
            }
            return null
          })}
        </tbody>
      </table>
      {uniqueGenres.map(genre => {
        return (
          <button key={genre} onClick={() => setGenre(genre)}>{genre}</button>
        )
      })}
      <button onClick={() => setGenre('all genres')}>all genres</button>
    </div>
  )
}

export default Books
