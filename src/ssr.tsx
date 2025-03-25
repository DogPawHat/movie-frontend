/// <reference types="vinxi/types/server" />
import {
  createStartHandler,
  defaultStreamHandler,
} from "@tanstack/react-start/server";
import { getRouterManifest } from "@tanstack/react-start/router-manifest";

import { createRouter } from "./router";

const handler = await (async () => {
  const router = await createRouter();
  return createStartHandler({
    createRouter: () => router,
    getRouterManifest,
  })(defaultStreamHandler);
})();

export default handler;
