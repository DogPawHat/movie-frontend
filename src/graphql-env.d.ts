/* eslint-disable */
/* prettier-ignore */

export type introspection_types = {
    'Boolean': unknown;
    'Float': unknown;
    'Genre': { kind: 'OBJECT'; name: 'Genre'; fields: { 'id': { name: 'id'; type: { kind: 'SCALAR'; name: 'ID'; ofType: null; } }; 'movies': { name: 'movies'; type: { kind: 'LIST'; name: never; ofType: { kind: 'OBJECT'; name: 'Movie'; ofType: null; }; } }; 'title': { name: 'title'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; }; };
    'GenreConnection': { kind: 'OBJECT'; name: 'GenreConnection'; fields: { 'nodes': { name: 'nodes'; type: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'Genre'; ofType: null; }; }; } }; 'pagination': { name: 'pagination'; type: { kind: 'OBJECT'; name: 'Pagination'; ofType: null; } }; }; };
    'GenreWithoutMovies': { kind: 'OBJECT'; name: 'GenreWithoutMovies'; fields: { 'id': { name: 'id'; type: { kind: 'SCALAR'; name: 'ID'; ofType: null; } }; 'title': { name: 'title'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; }; };
    'ID': unknown;
    'Int': unknown;
    'Movie': { kind: 'OBJECT'; name: 'Movie'; fields: { 'bestRating': { name: 'bestRating'; type: { kind: 'SCALAR'; name: 'Float'; ofType: null; } }; 'datePublished': { name: 'datePublished'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; 'directors': { name: 'directors'; type: { kind: 'LIST'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'duration': { name: 'duration'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; 'genres': { name: 'genres'; type: { kind: 'LIST'; name: never; ofType: { kind: 'OBJECT'; name: 'GenreWithoutMovies'; ofType: null; }; } }; 'id': { name: 'id'; type: { kind: 'SCALAR'; name: 'ID'; ofType: null; } }; 'mainActors': { name: 'mainActors'; type: { kind: 'LIST'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; 'posterUrl': { name: 'posterUrl'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; 'rating': { name: 'rating'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; 'ratingValue': { name: 'ratingValue'; type: { kind: 'SCALAR'; name: 'Float'; ofType: null; } }; 'summary': { name: 'summary'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; 'title': { name: 'title'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; } }; 'worstRating': { name: 'worstRating'; type: { kind: 'SCALAR'; name: 'Float'; ofType: null; } }; 'writers': { name: 'writers'; type: { kind: 'LIST'; name: never; ofType: { kind: 'SCALAR'; name: 'String'; ofType: null; }; } }; }; };
    'MovieConnection': { kind: 'OBJECT'; name: 'MovieConnection'; fields: { 'nodes': { name: 'nodes'; type: { kind: 'LIST'; name: never; ofType: { kind: 'NON_NULL'; name: never; ofType: { kind: 'OBJECT'; name: 'Movie'; ofType: null; }; }; } }; 'pagination': { name: 'pagination'; type: { kind: 'OBJECT'; name: 'Pagination'; ofType: null; } }; }; };
    'MovieFilterInput': { kind: 'INPUT_OBJECT'; name: 'MovieFilterInput'; isOneOf: false; inputFields: [{ name: 'search'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; }; defaultValue: null }, { name: 'genre'; type: { kind: 'SCALAR'; name: 'String'; ofType: null; }; defaultValue: null }]; };
    'Pagination': { kind: 'OBJECT'; name: 'Pagination'; fields: { 'page': { name: 'page'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Int'; ofType: null; }; } }; 'perPage': { name: 'perPage'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Int'; ofType: null; }; } }; 'totalPages': { name: 'totalPages'; type: { kind: 'NON_NULL'; name: never; ofType: { kind: 'SCALAR'; name: 'Int'; ofType: null; }; } }; }; };
    'PaginationInput': { kind: 'INPUT_OBJECT'; name: 'PaginationInput'; isOneOf: false; inputFields: [{ name: 'page'; type: { kind: 'SCALAR'; name: 'Int'; ofType: null; }; defaultValue: null }, { name: 'perPage'; type: { kind: 'SCALAR'; name: 'Int'; ofType: null; }; defaultValue: null }]; };
    'Query': { kind: 'OBJECT'; name: 'Query'; fields: { 'genre': { name: 'genre'; type: { kind: 'OBJECT'; name: 'Genre'; ofType: null; } }; 'genres': { name: 'genres'; type: { kind: 'OBJECT'; name: 'GenreConnection'; ofType: null; } }; 'movie': { name: 'movie'; type: { kind: 'OBJECT'; name: 'Movie'; ofType: null; } }; 'movies': { name: 'movies'; type: { kind: 'OBJECT'; name: 'MovieConnection'; ofType: null; } }; }; };
    'String': unknown;
};

/** An IntrospectionQuery representation of your schema.
 *
 * @remarks
 * This is an introspection of your schema saved as a file by GraphQLSP.
 * It will automatically be used by `gql.tada` to infer the types of your GraphQL documents.
 * If you need to reuse this data or update your `scalars`, update `tadaOutputLocation` to
 * instead save to a .ts instead of a .d.ts file.
 */
export type introspection = {
  name: never;
  query: "Query";
  mutation: never;
  subscription: never;
  types: introspection_types;
};

import * as gqlTada from "gql.tada";

declare module "gql.tada" {
  interface setupSchema {
    introspection: introspection;
  }
}
