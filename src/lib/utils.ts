import { createMiddleware } from "@tanstack/react-start";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Say no to magic numbers kids
export const PER_PAGE = 5;

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const preLogMiddleware = createMiddleware()
	.client(async (ctx) => {
		const clientTime = new Date();

		return ctx.next({
			context: {
				clientTime,
			},
			sendContext: {
				clientTime,
			},
		});
	})
	.server(async (ctx) => {
		const serverTime = new Date();

		return ctx.next({
			sendContext: {
				serverTime,
				durationToServer:
					serverTime.getTime() - ctx.context.clientTime.getTime(),
			},
		});
	});

export const logMiddleware = createMiddleware()
	.middleware([preLogMiddleware])
	.client(async (ctx) => {
		const res = await ctx.next();

		const now = new Date();
		console.log("Client Req/Res:", {
			duration: res.context.clientTime.getTime() - now.getTime(),
			durationToServer: res.context.durationToServer,
			durationFromServer: now.getTime() - res.context.serverTime.getTime(),
		});

		return res;
	});

export function formatDuration(duration: string | null) {
	if (!duration) return "Unknown duration";

	// Parse ISO 8601 duration format (e.g., PT2H14M)
	const hoursMatch = duration.match(/(\d+)H/);
	const minutesMatch = duration.match(/(\d+)M/);

	const hours = hoursMatch ? Number.parseInt(hoursMatch[1] || "0", 10) : 0;
	const minutes = minutesMatch
		? Number.parseInt(minutesMatch[1] || "0", 10)
		: 0;

	return `${hours}h ${minutes}m`;
}
