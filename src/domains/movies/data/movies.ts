import { type ResultOf, graphql } from "gql.tada";

export const MOVIE_FIELDS = graphql(`
  fragment MovieFields on Movie {
    id
    title
    posterUrl
    rating
    duration
    datePublished
  }
`);

export type MovieFields = ResultOf<typeof MOVIE_FIELDS>;

export const GET_MOVIES_SEARCH = graphql(
	`
  query GetMoviesSearch($search: String!, $genre: String, $page: Int! = 0) {
    movies(
      where: { search: $search, genre: $genre }
      pagination: { perPage: 10, page: $page }
    ) {
      nodes {
        ...MovieFields
      }
      pagination {
        perPage
        page
        totalPages
      }
    }
  }
`,
	[MOVIE_FIELDS],
);
