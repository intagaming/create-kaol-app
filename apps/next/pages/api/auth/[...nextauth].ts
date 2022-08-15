import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "db";
import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
    {
      ...GithubProvider({
        clientId: process.env.EXPO_GITHUB_ID ?? "",
        clientSecret: process.env.EXPO_GITHUB_SECRET ?? "",
      }),
      id: "github-expo",
    },
  ],
};

export default NextAuth(authOptions);
