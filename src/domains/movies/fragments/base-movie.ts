import { graphql } from "gql.tada";

export const BaseMovieFields = graphql(`
  fragment BaseMovieFields on Movie {
    id
    title
    posterUrl
    rating
    ratingValue
    duration
    datePublished
  }
`);
