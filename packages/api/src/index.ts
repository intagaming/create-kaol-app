import { createRouter } from "./routers/context";

export const appRouter = createRouter();

export type AppRouter = typeof appRouter;
