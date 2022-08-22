import * as trpc from "@trpc/server";
import { inferAsyncReturnType } from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import crypto from "crypto";
import { prisma } from "db";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "../../../../apps/next/pages/api/auth/[...nextauth]";
import { authCookies } from "./auth";

export const createRouter = () => trpc.router<Context>();

export const createContext = async ({
  req,
  res,
}: trpcNext.CreateNextContextOptions) => {
  const requestId = crypto.randomBytes(10).toString("hex");
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const sessionToken = authHeader.split(" ")[1];
    if (sessionToken) {
      // Modify session-token
      const reqCookie = req.headers.cookie ?? "";
      const parsedCookies = reqCookie.split("; ").reduce((acc, cookie) => {
        const [key, value] = cookie.split("=");
        acc[key as string] = value as string;
        return acc;
      }, {} as { [key: string]: string });
      parsedCookies[authCookies.sessionToken.name] = sessionToken;
      const newCookie = Object.entries(parsedCookies)
        .reduce((acc, [key, value]) => {
          acc.push(`${key}=${value}`);
          return acc;
        }, [] as string[])
        .join("; ");

      req.headers.cookie = newCookie;
    }
  }
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
