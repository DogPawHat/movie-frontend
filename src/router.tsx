import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";
import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { GraphQLClient, type RequestMiddleware } from "graphql-request";
import * as v from "valibot";
import { DefaultCatchBoundary } from "./components/default-catch-boundary";
import { NotFound } from "./components/not-found";
import { env } from "./env";
import { routeTree } from "./routeTree.gen";

const TokenReturnSchema = v.object({
	token: v.string(),
});

// Fetch and store the auth token in a Tanstack Start server function and return to client
// This allows us to store the token in the a secure cookie
// I generally prefer cookie based auth over localStorage when possible
// Obviously overkill in this example given the auth endpoint itself is not protected
const getAuthToken = createServerFn({ method: "GET" }).handler(async () => {
	const maybeToken = getCookie("api-auth-token");

	if (!maybeToken) {
		console.log("No token found, fetching new one");
		const newToken = await fetch(`${env.VITE_PUBLIC_API_URL}/auth/token`, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!newToken.ok) {
			throw new Error("Failed to fetch auth token");
		}

		const { token } = v.parse(TokenReturnSchema, await newToken.json());

		setCookie("api-auth-token", token, {
			httpOnly: true,
			secure: true,
			sameSite: "strict",
		});

		console.log("New token fetched, returning");
		return token;
	}

	console.log("Token found, returning");
	return maybeToken;
});

export function createRouter() {
	const queryClient = new QueryClient();
	// only fetch the token into memory once
	const tokenPromise = getAuthToken();

	// add the token to the request headers
	const requestMiddleware: RequestMiddleware = async (request) => {
		return {
			...request,
			headers: {
				...request.headers,
				"Content-Type": "application/json",
				Authorization: `Bearer ${await tokenPromise}`,
			},
		};
	};

	// create the graphql client
	const graphqlClient = new GraphQLClient(
		`${env.VITE_PUBLIC_API_URL}/graphql`,
		{
			requestMiddleware,
		},
	);

	// create the router
	const router = createTanStackRouter({
		routeTree,
		context: {
			/** Tanstack Query Client */
			queryClient,
			/** graphql request Client with auth middleware */
			graphqlClient,
		},
		defaultPreload: "intent",
		defaultErrorComponent: DefaultCatchBoundary,
		defaultNotFoundComponent: () => <NotFound />,
		scrollRestoration: true,
	});

	return routerWithQueryClient(router, queryClient);
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof createRouter>;
	}
}
