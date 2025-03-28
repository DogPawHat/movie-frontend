import { type ResultOf, graphql } from "gql.tada";

export const MOVIE_FIELDS = graphql(`
  fragment MovieFields on Movie {
    id
    title
    posterUrl
    rating
    ratingValue
    duration
    datePublished
  }
`);

export const FULL_MOVIE_FIELDS = graphql(`
  fragment FullMovieFields on Movie {
    ...MovieFields
    summary
    directors
    mainActors
    writers
    genres {
      id
      title
    }
    
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

export const GET_FULL_MOVIE = graphql(
	`
  query GetFullMovie($id: ID!) {
    movie(id: $id) {
      ...FullMovieFields
    }
  }`,
	[FULL_MOVIE_FIELDS],
);
