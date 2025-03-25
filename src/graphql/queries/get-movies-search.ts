import { graphql } from "gql.tada";

export const GET_MOVIES_SEARCH = graphql(`
  query GetMoviesSearch($search: String!) {
    movies(where: { search: $search }) {
      nodes {
        id
        title
        datePublished
        posterUrl
      }
    }
  }
`);
