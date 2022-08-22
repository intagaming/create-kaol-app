import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "db";
import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";

const prismaAdapter = PrismaAdapter(prisma);

const providerPairs: { [provider: string]: string } = {
  github: "github-expo",
  "github-expo": "github",
};

export const authOptions: NextAuthOptions = {
  adapter: prismaAdapter,
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
    {
      ...GithubProvider({
        clientId: process.env.EXPO_GITHUB_ID ?? "",
        clientSecret: process.env.EXPO_GITHUB_SECRET ?? "",
        checks: ["state", "pkce"],
        token: {
          async request(context) {
            // context contains useful properties to help you make the request.
            const tokens = await context.client.oauthCallback(
              "https://auth.expo.io/@xuanan2001/kaol-expo",
              context.params,
              context.checks
            );
            return { tokens };
          },
        },
      }),
      id: providerPairs["github"],
    },
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      else if (url.startsWith("https://auth.expo.io/@xuanan2001/kaol-expo"))
        return url;
      return baseUrl;
    },
    async signIn({ account }) {
      const userByAccount = await prismaAdapter.getUserByAccount({
        providerAccountId: account.providerAccountId,
        provider: account.provider,
      });
      // If registering
      if (!userByAccount) {
        if (account.provider in providerPairs) {
          const counterpart = providerPairs[account.provider];
          const userByAccount = await prismaAdapter.getUserByAccount({
            providerAccountId: account.providerAccountId,
            provider: counterpart,
          });
          // If exists the account in the counterpart provider
          if (userByAccount) {
            // Link the account to the user
            await prismaAdapter.linkAccount({
              ...account,
              userId: userByAccount.id,
            });
          }
        }
      }

      return true;
    },
  },
};

export default NextAuth(authOptions);
