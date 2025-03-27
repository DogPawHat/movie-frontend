import { registerGlobalMiddleware } from "@tanstack/react-start";
import { logMiddleware } from "./lib/utils";

registerGlobalMiddleware({
	middleware: [logMiddleware],
});
