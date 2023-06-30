import { ALL_AUTHORS, EDIT_AUTHOR } from '../queries'
import { useMutation, useQuery } from '@apollo/client'
import { useState } from 'react'


const SetBirthYear = () => {
  const [ name, setName ] = useState('')
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
      editAuthor({ variables: { name: name, setBornTo: bornAsInt } })
      setName('')
      setBorn('')
    } catch (error) {
      console.log(error.message)
    }
  }

  return (
    <div>
      <h2>Set birthyear</h2>
      <div>
        name <input
          value={name}
          onChange={({ target }) => setName(target.value)}
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
      <SetBirthYear />
    </div>
  )
}

export default Authors
