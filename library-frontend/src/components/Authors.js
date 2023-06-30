import { ALL_AUTHORS, EDIT_AUTHOR } from '../queries'
import { useMutation, useQuery } from '@apollo/client'
import { useState } from 'react'
import Select from 'react-select'

const SetBirthYear = ({ authors }) => {
  const options = authors.map(author => ( { value: author.name, label: author.name } ))
  const [ selectedAuthor, setSelectedAuthor ] = useState(null)
  const [ born, setBorn ] = useState('')

  const [ editAuthor ] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [ { query: ALL_AUTHORS } ],
    onError: (error) => {
      console.log(error.message)
    }
  })

  const submitBorn = async (event) => {
    event.preventDefault()
    try {
      const bornAsInt = Number.parseInt(born)
      editAuthor({ variables: { name: selectedAuthor.value, setBornTo: bornAsInt } })
      setBorn('')
    } catch (error) {
      console.log(error.message)
    }
  }

  return (
    <div>
      <h2>Set birthyear</h2>
      <div>
        <Select
          defaultValue={selectedAuthor}
          onChange={setSelectedAuthor}
          options={options}
        />
      </div>
      <div>
        born <input
          value={born}
          onChange={({ target }) => setBorn(target.value)}
        />
      </div>
      <div>
        <button onClick={submitBorn}>update author</button>
      </div>
    </div>
  )

}

const Authors = () => {
  const result = useQuery(ALL_AUTHORS)

  if (result.loading) {
    return <div>Authors are loading...</div>
  }

  const authors = result.data.allAuthors

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.map((a) => (
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <SetBirthYear authors={authors} />
    </div>
  )
}

export default Authors
