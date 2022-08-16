import { authRouter } from "./routers/auth";
import { createRouter } from "./routers/context";
import { exampleRouter } from "./routers/example";
import { protectedExampleRouter } from "./routers/protected";

export const appRouter = createRouter()
  .merge("example.", exampleRouter)
  .merge("protected.", protectedExampleRouter)
  .merge("auth.", authRouter);

export type AppRouter = typeof appRouter;
