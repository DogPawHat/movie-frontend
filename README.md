# Move Search App

## Setup

Copy `.env.example` to `.env` and set `VITE_PUBLIC_API_URL` to the GraphQL host

Run `pnpm run dev` to run the app and `pnpm run build`

To get type infererance and typechecking locally, run `pnpm generate-schema` first

## Highlights

This is a Tanstack Start app that uses Tanstack Query and graphql-request to request data from the api, with [gql.tada](https://gql-tada.0no.co/) used to provide type inference. I've picked up Tanstack because I've been playing around with it quite a bit and been participating quite a bit in the Tanstack discord answering questions related to query. The one killer feature I wanted to utilize is preloading and caching to provide a very smooth experience. I did try Apollo Client early on but it's intergration with Tanstack Start is a bit rough as it's still in alpha and I wasn't happy with some of the workarounds I had to make.

The struction of the project is as follows:

- Tanstack Start base cloned with "npx degit https://github.com/tanstack/router/examples/react/start-basic movie-frontend". (You can check [this guide](https://tanstack.com/start/latest/docs/framework/react/build-from-scratch) out to get a sense of the basic structure of a Tanstack Start app)
- Tanstack Query intergration set up in `router.tsx`. we also set up Graphql Client and auth here as well.
- ShadCn, Radix and Tailwind provide the standard design components. It makes getting a decent UX up and running and pairs excellently with AI tooling in Cursor.
- GraphQL queries are defined in route files and used in `queryOptions` objects with the `graphQLClient` in the route context function. Fragments for the app are located in `domains/movies/data`
- `index.tsx` is where the guts of the app is. The state of the table filters is stored in search query params validated with Valibot (Search Params are a killer feature of Tanstack Router, see [here](https://tanstack.com/router/latest/docs/framework/react/guide/search-params) for more details). The filters components and data table for this route I have placed in `domains/movies/components`
- I've also added a full movie viewer at `/movie/$movieId` where you can see more details on a given movie (generes, crew and cast, etc)
- AI usage disclamer: Project was done in Cursor with a pro sub on and tab turned on all the time. Most of the scaffolding and configuration was done mostly by hand with almost no AI prompting, as Start is still in beta and I am petty particualar about . On the other end of the spectrum, Claude's proficency with shadcn layouts meant it did a lot of the heavy lifting prompt layout wise and the form controls were copied from a v0 prompt intially. most of the graphql and tanstack data loading was heavely tuned by myself for most of the project. Most of the code was read and reread before being committed in.

I'm pretty happy with how well it's come out. I've set up preload intent links on the movie viewer, and I also prefetch the previous and next pages in the table as well, so you usually never hit the loading state when going back and forth. I've also added optimistic debounced prefetching to the query and genre filters to improve responstivieness in that flow.

There's quite a bit of layout shift going on that I'd like to fix. I managed to tamp down on some of it but it still requires more work and it quite jarring at the moment. I also wanted to add in light mode but that's tricky with Start as it doens't have a version of `next-themes` for ssr. I also if it was in scope for this project made my own backend as while GraphQL was the best choice I had for type inferierce in this case, the schema had quite a lot of nullables, and I generally prefer something like tRPC or Server Functions anyway.

Anyway, I've enjoyed building this website quite a bit and I am happy to ship it. Enjoy!
