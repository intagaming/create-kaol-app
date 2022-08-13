import { inferAsyncReturnType, TRPCError } from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import * as trpc from "@trpc/server";
import crypto from "crypto";
import { prismaClient } from "db";

export const createRouter = () => trpc.router<Context>();

export const createContext = async ({
  req,
  res,
}: trpcNext.CreateNextContextOptions) => {
  const requestId = crypto.randomBytes(10).toString("hex");

  return {
    headers: req.headers,
    req: { ...req, id: requestId },
    res,
    prisma: prismaClient,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
