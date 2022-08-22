import { createRouter } from "./context";
import z from "zod";
import type { CookiesOptions } from "next-auth/core/types";
import { webHost } from "app/config";

export function defaultCookies(useSecureCookies: boolean): CookiesOptions {
  const cookiePrefix = useSecureCookies ? "__Secure-" : "";
  return {
    // default cookie options
    sessionToken: {
      name: `${cookiePrefix}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    csrfToken: {
      // Default to __Host- for CSRF token for additional protection if using useSecureCookies
      // NB: The `__Host-` prefix is stricter than the `__Secure-` prefix.
      name: `${useSecureCookies ? "__Host-" : ""}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    pkceCodeVerifier: {
      name: `${cookiePrefix}next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    state: {
      name: `${cookiePrefix}next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  };
}

export const getCookieFromHeader = (name: string, headers: Headers) => {
  return headers
    .get("set-cookie")
    ?.split(", ")
    .filter((s) => s.startsWith(`${name}=`))[0]
    ?.split("=")[1]
    ?.split(";")[0];
};

const cookies = defaultCookies(false);

const appendCookie = (cookieString: string, cookie: string) => {
  return cookieString !== "" ? `${cookieString}; ${cookie}` : cookie;
};

export const authRouter = createRouter()
  .query("signIn", {
    input: z.object({
      provider: z.string(),
      proxyRedirectUri: z.string(),
    }),
    resolve: async ({ input }) => {
      // Get csrf token
      const csrfTokenRes = await fetch(`${webHost}/api/auth/csrf`);
      const csrfToken = (await csrfTokenRes.json()).csrfToken;
      const csrfTokenCookie = getCookieFromHeader(
        cookies.csrfToken.name,
        csrfTokenRes.headers
      ) as string;

      // Get authorizationUrl
      const callbackUrl = input.proxyRedirectUri;
      const signInRes = await fetch(
        `${webHost}/api/auth/signin/${input.provider}`,
        {
          redirect: "manual",
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Cookie: `${cookies.csrfToken.name}=${csrfTokenCookie}; ${cookies.callbackUrl.name}=${callbackUrl}`,
          },
          body: `csrfToken=${csrfToken}&callbackUrl=${callbackUrl}`,
        }
      );

      const authorizationUrl = signInRes.headers.get("location") as string;
      const url = new URL(authorizationUrl);
      const params = new URLSearchParams(url.search);

      // state
      const stateEncrypted = getCookieFromHeader(
        cookies.state.name,
        signInRes.headers
      ) as string;
      const state = params.get("state") as string;

      // pkce code verifier
      const codeChallenge = params.get("code_challenge") as string;
      const codeVerifier = getCookieFromHeader(
        cookies.pkceCodeVerifier.name,
        signInRes.headers
      ) as string;

      return {
        state,
        stateEncrypted,
        csrfTokenCookie,
        codeVerifier,
        codeChallenge,
      };
    },
  })
  .query("callback", {
    input: z.object({
      provider: z.string(),
      code: z.string(),
      state: z.string(),
      stateEncrypted: z.string(),
      csrfTokenCookie: z.string(),
      callbackUrl: z.string(),
      codeVerifier: z.string(),
    }),
    resolve: async ({ input }) => {
      // Callback
      const callbackRes = await fetch(
        `${webHost}/api/auth/callback/${input.provider}?state=${input.state}&code=${input.code}`,
        {
          redirect: "manual",
          headers: {
            Cookie: `${cookies.csrfToken.name}=${input.csrfTokenCookie}; ${cookies.state.name}=${input.stateEncrypted}; ${cookies.pkceCodeVerifier.name}=${input.codeVerifier}`,
          },
        }
      );
      const sessionToken = getCookieFromHeader(
        cookies.sessionToken.name,
        callbackRes.headers
      ) as string;
      return { sessionToken };
    },
  })
  .query("csrf", {
    resolve: async () => {
      const csrfTokenRes = await fetch(`${webHost}/api/auth/csrf`);
      const csrfToken = (await csrfTokenRes.json()).csrfToken;
      const csrfTokenCookie = getCookieFromHeader(
        cookies.csrfToken.name,
        csrfTokenRes.headers
      ) as string;
      return {
        csrfToken,
        csrfTokenCookie,
      };
    },
  })
  .query("proxy", {
    input: z.object({
      path: z.string(),
      sessionToken: z.string().nullable(),
      csrfToken: z.string().nullable(),
    }),
    resolve: async ({ input }) => {
      let cookieString = "";

      if (input.sessionToken) {
        const sessionTokenCookie = `${cookies.sessionToken.name}=${input.sessionToken}`;
        cookieString = appendCookie(cookieString, sessionTokenCookie);
      }
      if (input.csrfToken) {
        const csrfCookie = `${cookies.csrfToken.name}=${input.csrfToken}`;
        cookieString = appendCookie(cookieString, csrfCookie);
      }

      const options: RequestInit = {};
      if (cookieString !== "") {
        options.headers = {
          Cookie: cookieString,
        };
      }

      const res = await fetch(`${webHost}/api/auth/${input.path}`, options);
      const data = await res.json();
      if (!res.ok) throw data;
      return Object.keys(data).length > 0 ? data : null; // Return null if data empty
    },
  })
  .mutation("logout", {
    input: z.object({
      sessionToken: z.string(),
      csrfToken: z.string(),
    }),
    resolve: async ({ input }) => {
      let cookieString = "";

      const sessionTokenCookie = `${cookies.sessionToken.name}=${input.sessionToken}`;
      cookieString = appendCookie(cookieString, sessionTokenCookie);
      const csrfCookie = `${cookies.csrfToken.name}=${input.csrfToken}`;
      cookieString = appendCookie(cookieString, csrfCookie);

      const options: RequestInit = {
        method: "post",
        headers: {
          Cookie: cookieString,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        // @ts-expect-error
        body: new URLSearchParams({
          csrfToken: input.csrfToken,
          callbackUrl: webHost,
          json: true,
        }),
      };

      const res = await fetch(`${webHost}/api/auth/signout`, options);
      const data = await res.json();
      if (!res.ok) throw data;
      return true;
    },
  });
