const BookRow = ({ book }) => (
  <tr key={book.title}>
    <td>{book.title}</td>
    <td>{book.author.name}</td>
    <td>{book.published}</td>
  </tr>
)

export default BookRow