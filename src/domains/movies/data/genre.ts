import { graphql } from "gql.tada";

export const GET_GENRES = graphql(`
  query GetGenres {
    genres(pagination: { perPage: 100 }) {
      nodes {
        id
        title
      }
    }
  }
`);
