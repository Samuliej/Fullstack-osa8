import { ME, ALL_BOOKS } from '../queries'
import { useQuery, useLazyQuery } from '@apollo/client'
import BookRow from './BookRow'
import { useEffect } from 'react'

const RecommendBooks = () => {
  const result = useQuery(ME)
  const [getBooks, bookResult] = useLazyQuery(ALL_BOOKS)

  useEffect(() => {
    if(result.data) {
      const favoriteGenre = result.data.me.favoriteGenre
      getBooks({ variables: { genre: favoriteGenre } })
    }
  }, [result.data, getBooks])

  if (result.loading) {
    return <div>User loading...</div>
  }


  if (bookResult.loading || !bookResult.data) {
    return <div>Books are loading...</div>
  }

  const favoriteBooks = bookResult.data.allBooks


  return (
    <div>
      <h2>recommendations</h2>

      books in your favorite genre <strong>{result.data.me.favoriteGenre}</strong>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {favoriteBooks.map((b) => <BookRow key={b.title} book={b} />)}
        </tbody>
      </table>
    </div>
  )
}

export default RecommendBooks