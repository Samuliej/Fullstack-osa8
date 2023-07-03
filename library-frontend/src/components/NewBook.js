import { useMutation } from '@apollo/client'
import { useState } from 'react'
import { ADD_BOOK, ALL_AUTHORS, ALL_BOOKS } from '../queries'

const NewBook = ({ setError, setNotif }) => {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [published, setPublished] = useState('')
  const [genre, setGenre] = useState('')
  const [genres, setGenres] = useState([])

  const [ addBook ] = useMutation(ADD_BOOK, {
    refetchQueries: [ { query: ALL_BOOKS }, { query: ALL_AUTHORS } ],
    onError: (error) => {
      setError(error.graphQLErrors[0].message)
    }
  })

  const submit = async (event) => {
    event.preventDefault()

    try {
      const publishedAsInt = Number.parseInt(published)

      if (!title) {setError('Please enter a title'); return}
      if (!author) {setError('Please enter an author'); return}
      if (!published) {setError('Please set published year'); return}
      if (genres.length === 0) {setError('Please enter atleast one genre'); return}

      addBook({ variables: { title, author, published: publishedAsInt, genres } })
      setNotif(`Book ${title} added succesfully`)
      setTitle('')
      setPublished('')
      setAuthor('')
      setGenres([])
      setGenre('')

    } catch (error) {
      console.log(error)
    }
  }

  const addGenre = () => {
    setGenres(genres.concat(genre))
    setGenre('')
  }

  return (
    <div>
      <form onSubmit={submit}>
        <div>
          title
          <input
            value={title}
            onChange={({ target }) => setTitle(target.value)}
          />
        </div>
        <div>
          author
          <input
            value={author}
            onChange={({ target }) => setAuthor(target.value)}
          />
        </div>
        <div>
          published
          <input
            type="number"
            value={published}
            onChange={({ target }) => setPublished(target.value)}
          />
        </div>
        <div>
          <input
            value={genre}
            onChange={({ target }) => setGenre(target.value)}
          />
          <button onClick={addGenre} type="button">
            add genre
          </button>
        </div>
        <div>genres: {genres.join(' ')}</div>
        <button type="submit">create book</button>
      </form>
    </div>
  )
}

export default NewBook