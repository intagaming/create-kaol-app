import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "db";
import NextAuth, { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import DiscordProvider from "next-auth/providers/discord";
import { isValidProvider, nativeProviders } from "config/auth";

const prismaAdapter = PrismaAdapter(prisma);

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
            const tokens = await context.client.oauthCallback(
              process.env.EXPO_PROXY_URL,
              context.params,
              context.checks
            );
            return { tokens };
          },
        },
      }),
      id: nativeProviders.github,
    },
    DiscordProvider({
      clientId: process.env.DISCORD_ID ?? "",
      clientSecret: process.env.DISCORD_SECRET ?? "",
    }),
    {
      ...DiscordProvider({
        clientId: process.env.DISCORD_ID ?? "",
        clientSecret: process.env.DISCORD_SECRET ?? "",
        token: {
          async request(context) {
            const tokens = await context.client.oauthCallback(
              process.env.EXPO_PROXY_URL,
              context.params,
              context.checks
            );
            return { tokens };
          },
        },
      }),
      id: nativeProviders.discord,
    },
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      else if (process.env.EXPO_PROXY_URL && url === process.env.EXPO_PROXY_URL)
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
        const provider = account.provider;
        if (isValidProvider(provider)) {
          const counterpart = nativeProviders[provider];
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
  pages: {
    signIn: "/login",
  },
};

export default NextAuth(authOptions);
