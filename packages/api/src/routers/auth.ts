import { createRouter } from "./context";
import z from "zod";
import type { CookiesOptions } from "next-auth/core/types";

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
    ?.split(",")
    .filter((s) => s.startsWith(`${name}=`))[0]
    ?.split("=")[1]
    ?.split(";")[0];
};

export const authRouter = createRouter().query("signIn", {
  input: z.object({
    code: z.string(),
  }),
  resolve: async ({ input }) => {
    const cookies = defaultCookies(false);

    // Get csrf token
    const csrfTokenRes = await fetch("http://localhost:3000/api/auth/csrf");
    const csrfToken = (await csrfTokenRes.json()).csrfToken;
    const csrfTokenSetCookie = getCookieFromHeader(
      cookies.csrfToken.name,
      csrfTokenRes.headers
    );
    // console.log("csrfTokenSetCookie", csrfTokenSetCookie);

    // Get state
    const signInRes = await fetch(
      "http://localhost:3000/api/auth/signin/github-expo",
      {
        redirect: "manual",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Cookie: `${cookies.csrfToken.name}=${csrfTokenSetCookie}; ${cookies.callbackUrl.name}=http%3A%2F%2Flocalhost%3A3000`,
        },
        body: `csrfToken=${csrfToken}&callbackUrl=http://localhost:3000`,
      }
    );
    const stateEncrypted = getCookieFromHeader(
      cookies.state.name,
      signInRes.headers
    );
    const state = signInRes.headers.get("location")?.split("state=")[1];
    // console.log(
    //   signInRes.status,
    //   signInRes.headers,
    //   "state",
    //   state,
    //   stateEncrypted
    // );

    // Callback
    const callbackRes = await fetch(
      `http://localhost:3000/api/auth/callback/github-expo?state=${state}&code=${input.code}`,
      {
        redirect: "manual",
        headers: {
          Cookie: `${cookies.csrfToken.name}=${csrfTokenSetCookie}; ${cookies.callbackUrl.name}=http%3A%2F%2Flocalhost%3A3000; ${cookies.state.name}=${stateEncrypted}`,
        },
      }
    );
    console.log(callbackRes.status, callbackRes.headers);

    return {};
  },
});
