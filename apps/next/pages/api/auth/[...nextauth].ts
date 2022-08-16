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
      id: "github-expo",
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
  },
};

export default NextAuth(authOptions);
