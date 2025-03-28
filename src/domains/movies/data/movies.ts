import { type ResultOf, graphql } from "gql.tada";

export const BASE_MOVIE_FIELDS = graphql(`
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

export const FULL_MOVIE_FIELDS = graphql(
	`
  fragment FullMovieFields on Movie {
    summary
    directors
    mainActors
    writers
    genres {
      id
      title
    }
  }
`,
);

export type MovieFields = ResultOf<typeof BASE_MOVIE_FIELDS>;

export const GET_MOVIES_SEARCH = graphql(
	`
  query GetMoviesSearch($search: String!, $genre: String, $page: Int! = 0) {
    movies(
      where: { search: $search, genre: $genre }
      pagination: { perPage: 10, page: $page }
    ) {
      nodes {
        ...BaseMovieFields
      }
      pagination {
        perPage
        page
        totalPages
      }
    }
  }
`,
	[BASE_MOVIE_FIELDS],
);

export const GET_FULL_MOVIE = graphql(
	`
  query GetFullMovie($id: ID!) {
    movie(id: $id) {
      ...BaseMovieFields
      ...FullMovieFields
    }
  }`,
	[BASE_MOVIE_FIELDS, FULL_MOVIE_FIELDS],
);
