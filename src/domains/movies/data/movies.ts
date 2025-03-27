import { graphql } from "gql.tada";

export const GET_MOVIES_SEARCH = graphql(`
  query GetMoviesSearch($search: String!, $genre: String, $page: Int! = 0) {
    movies(
      where: { search: $search, genre: $genre }
      pagination: { perPage: 10, page: $page }
    ) {
      nodes {
        id
        title
        posterUrl
        datePublished
      }
      pagination {
        perPage
        page
        totalPages
      }
    }
  }
`);
