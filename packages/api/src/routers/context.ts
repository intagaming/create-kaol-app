import * as trpc from "@trpc/server";
import { inferAsyncReturnType } from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import crypto from "crypto";
import { prisma } from "db";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "../../../../apps/next/pages/api/auth/[...nextauth]";

export const createRouter = () => trpc.router<Context>();

export const createContext = async ({
  req,
  res,
}: trpcNext.CreateNextContextOptions) => {
  const requestId = crypto.randomBytes(10).toString("hex");
  const session = await unstable_getServerSession(req, res, authOptions);

  return {
    headers: req.headers,
    req: { ...req, id: requestId },
    res,
    prisma,
    session,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
