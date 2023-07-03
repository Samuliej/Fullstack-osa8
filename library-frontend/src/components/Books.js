import { useState } from "react"
import BookRow from "./BookRow"
import { useLazyQuery } from "@apollo/client"
import { ALL_BOOKS } from "../queries"
import { useEffect } from "react"

const Books = ({ books }) => {
  const [genre, setGenre] = useState('')
  const [getBooks, result] = useLazyQuery(ALL_BOOKS)


  useEffect(() => {
    getBooks({ variables: { genre } })
  }, [genre, getBooks])

  if (result.loading) {
    return <div>Books are loading...</div>
  }

  const booksByGenre = result.data ? result.data.allBooks : []
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
          {booksByGenre.map((b) => <BookRow key={b.title} book={b} /> ) }
        </tbody>
      </table>
      {uniqueGenres.map(genre => {
        return (
          <button key={genre} onClick={() => setGenre(genre)}>{genre}</button>
        )
      })}
      <button onClick={() => setGenre('')}>all genres</button>
    </div>
  )
}

export default Books
