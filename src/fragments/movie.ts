import { graphql } from "gql.tada";

export const MOVIE_BASIC = graphql(`
  fragment BasicMovie on Movie {
    id
    title
    datePublished
    posterUrl
  }
`);
