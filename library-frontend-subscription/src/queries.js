import { gql } from '@apollo/client'

export const ALL_AUTHORS = gql`
  query {
    allAuthors {
      name
      born
      bookCount
    }
  }
`

const BOOK_DETAILS = gql`
  fragment BookDetails on Book {
    title
    genres
    author {
      name
      born
      bookCount
    }
    published
  }
`

export const BOOK_ADDED = gql`
  subscription {
    bookAdded {
      ...BookDetails
    }
  }
  ${BOOK_DETAILS}
`

export const ALL_BOOKS = gql`
  query allBooks($genre: String) {
    allBooks(genre: $genre) {
      title
      genres
      author {
        name
      }
      published
    }
  }
`

export const ADD_BOOK = gql`
  mutation addBook(
    $title: String!,
    $author: String!,
    $published: Int!,
    $genres: [String!]!) {
    addBook(
      title: $title,
      author: $author,
      published: $published,
      genres: $genres
    ) {
      title
      author {
        name
        born
        bookCount
      }
      genres
      published
    }
  }
`


export const EDIT_AUTHOR = gql`
  mutation EditAuthor($name: String!, $setBornTo: Int!) {
    editAuthor(name: $name, setBornTo: $setBornTo) {
      name
      born
    }
  }
`

export const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      value
    }
  }
`

export const ME = gql`
  query me {
    me {
      username
      favoriteGenre
    }
  }
`