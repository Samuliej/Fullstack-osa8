import { ME } from '../queries'
import { useQuery } from '@apollo/client'
import BookRow from './BookRow'


const RecommendBooks = ({ books }) => {
  const result = useQuery(ME)

  if (result.loading) {
    return <div>Books are loading...</div>
  }

  const favoriteGenre = result.data?.me?.favoriteGenre

  if (!favoriteGenre) return null

  return (
    <div>
      <h2>recommendations</h2>

      books in your favorite genre <strong>{favoriteGenre}</strong>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((b) => (b.genres.includes(favoriteGenre)) ? <BookRow key={b.title} book={b} /> : null)}
        </tbody>
      </table>
    </div>
  )
}

export default RecommendBooks