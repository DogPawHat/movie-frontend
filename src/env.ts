import { createEnv } from "@t3-oss/env-core";
import * as v from "valibot";

export const env = createEnv({
	/**
	 * The prefix that client-side variables must have. This is enforced both at
	 * a type-level and at runtime.
	 */
	clientPrefix: "VITE_PUBLIC_",

	client: {
		VITE_PUBLIC_API_URL: v.pipe(v.string(), v.url(), v.minLength(1)),
	},

	runtimeEnv: import.meta.env,

	emptyStringAsUndefined: true,
});
