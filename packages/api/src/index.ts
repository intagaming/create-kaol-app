import { createRouter } from "./routers/context";
import { exampleRouter } from "./routers/example";
import { protectedExampleRouter } from "./routers/protected";

export const appRouter = createRouter()
  .merge("example.", exampleRouter)
  .merge("protected.", protectedExampleRouter);

export type AppRouter = typeof appRouter;
