import type { AppRouter } from "api/src/index";
import { createReactQueryHooks } from "@trpc/react";
import { createTRPCClient } from "@trpc/client";

export const trpc = createReactQueryHooks<AppRouter>();
export * from "api/src/inferance-helpers";

export const trpcClient = createTRPCClient<AppRouter>({
  url: "http://localhost:3000/api/trpc",
});
