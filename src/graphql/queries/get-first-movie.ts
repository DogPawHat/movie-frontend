import { graphql } from "gql.tada";

export const GET_FIRST_MOVIE = graphql(`
  query GetFirstMovie($movieId: ID!) {
    movie(id: $movieId) {
      title
      id
    }
  }
`);
