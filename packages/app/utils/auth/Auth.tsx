// Note about signIn() and signOut() methods:
//
// On signIn() and signOut() we pass 'json: true' to request a response in JSON
// instead of HTTP as redirect URLs on other domains are not returned to
// requests made using the fetch API in the browser, and we need to ask the API
// to return the response as a JSON object (the end point still defaults to
// returning an HTTP response with a redirect for non-JavaScript clients).
//
// We use HTTP POST requests with CSRF Tokens to protect against CSRF attacks.

import { Session } from "next-auth";
import { CtxOrReq, NextAuthClientConfig, now } from "next-auth/client/_utils";
import _logger, { LoggerInstance, proxyLogger } from "next-auth/utils/logger";
import parseUrl from "next-auth/utils/parse-url";
import * as React from "react";

import type {
  ClientSafeProvider,
  LiteralUnion,
  SessionProviderProps,
  SignInAuthorizationParams,
  SignInOptions,
  SignInResponse,
  SignOutParams,
  UseSessionOptions,
} from "next-auth/react/types";

import type {
  BuiltInProviderType,
  RedirectableProviderType,
} from "next-auth/providers";

import { useFocusEffect } from "@react-navigation/native";
import { storageKeys } from "app/constants";
import { routes } from "app/navigation/routePaths";
import { webProviders } from "config/auth";
import Constants from "expo-constants";
import { Alert } from "react-native";
import { useRouter } from "solito/router";
import SafeStorage from "../safe-storage";
import { trpcClient } from "../trpc";
import { signinDiscord, signinGithub, SigninResult } from "./ExpoAuth";

export async function fetchData<T = any>(
  path: string,
  __NEXTAUTH: NextAuthClientConfig,
  logger: LoggerInstance,
  {}: CtxOrReq = {}
): Promise<T | null> {
  const url = `${apiBaseUrl(__NEXTAUTH)}/${path}`;
  const sessionToken = await SafeStorage.get(storageKeys.sessionToken);
  try {
    let csrfToken = await SafeStorage.get(storageKeys.csrfToken);
    if (!csrfToken) {
      csrfToken = (await getCsrfToken())?.csrfTokenCookie ?? null;
    }

    const res = await trpcClient.query("auth.proxy", {
      path,
      csrfToken,
      sessionToken,
    });
    return res;
  } catch (error) {
    logger.error("CLIENT_FETCH_ERROR", { error: error as Error, url });
    return null;
  }
}

export function apiBaseUrl(__NEXTAUTH: NextAuthClientConfig) {
  return `${__NEXTAUTH.baseUrlServer}${__NEXTAUTH.basePathServer}`;
}

const nextAuthUrl = Constants.manifest?.extra?.nextAuthUrl;

const __NEXTAUTH: NextAuthClientConfig = {
  baseUrl: parseUrl(nextAuthUrl).origin,
  basePath: parseUrl(nextAuthUrl).path,
  baseUrlServer: parseUrl(nextAuthUrl).origin,
  basePathServer: parseUrl(nextAuthUrl).path,
  _lastSync: 0,
  _session: undefined,
  _getSession: () => {},
};

const logger = proxyLogger(_logger, __NEXTAUTH.basePath);

export type SessionContextValue<R extends boolean = false> = R extends true
  ?
      | { data: Session; status: "authenticated" }
      | { data: null; status: "loading" }
  :
      | { data: Session; status: "authenticated" }
      | { data: null; status: "unauthenticated" | "loading" };

const SessionContext = React.createContext<SessionContextValue | undefined>(
  undefined
);

/**
 * React Hook that gives you access
 * to the logged in user's session data.
 *
 * [Documentation](https://next-auth.js.org/getting-started/client#usesession)
 */
export function useSession<R extends boolean>(options?: UseSessionOptions<R>) {
  // @ts-expect-error Satisfy TS if branch on line below
  const value: SessionContextValue<R> = React.useContext(SessionContext);
  if (!value && process.env.NODE_ENV !== "production") {
    throw new Error(
      "[next-auth]: `useSession` must be wrapped in a <SessionProvider />"
    );
  }

  const { required, onUnauthenticated } = options ?? {};

  const requiredAndNotLoading = required && value.status === "unauthenticated";

  const { push } = useRouter();

  React.useEffect(() => {
    if (requiredAndNotLoading) {
      if (onUnauthenticated) onUnauthenticated();
      else push(routes.login.getPath());
    }
  }, [requiredAndNotLoading, onUnauthenticated, push]);

  if (requiredAndNotLoading) {
    return { data: value.data, status: "loading" } as const;
  }

  return value;
}

export type GetSessionParams = CtxOrReq & {
  event?: "storage" | "timer" | "hidden" | string;
  triggerEvent?: boolean;
  broadcast?: boolean;
};

export async function getSession(params?: GetSessionParams) {
  const session = await fetchData<Session>(
    "session",
    __NEXTAUTH,
    logger,
    params
  );
  return session;
}

/**
 * Returns the current Cross Site Request Forgery Token (CSRF Token)
 * required to make POST requests (e.g. for signing in and signing out).
 * You likely only need to use this if you are not using the built-in
 * `signIn()` and `signOut()` methods.
 *
 * [Documentation](https://next-auth.js.org/getting-started/client#getcsrftoken)
 */
export async function getCsrfToken(params?: CtxOrReq) {
  const { csrfToken, csrfTokenCookie } = await trpcClient.query("auth.csrf");

  await SafeStorage.set(storageKeys.csrfToken, csrfTokenCookie);

  return {
    csrfToken,
    csrfTokenCookie,
  };
}

/**
 * It calls `/api/auth/providers` and returns
 * a list of the currently configured authentication providers.
 * It can be useful if you are creating a dynamic custom sign in page.
 *
 * [Documentation](https://next-auth.js.org/getting-started/client#getproviders)
 */
export async function getProviders() {
  return await fetchData<
    Record<LiteralUnion<BuiltInProviderType>, ClientSafeProvider>
  >("providers", __NEXTAUTH, logger);
}

/**
 * Client-side method to initiate a signin flow
 * or send the user to the signin page listing all possible providers.
 * Automatically adds the CSRF token to the request.
 *
 * [Documentation](https://next-auth.js.org/getting-started/client#signin)
 */
export async function signIn<
  P extends RedirectableProviderType | undefined = undefined
>(
  provider: LiteralUnion<
    P extends RedirectableProviderType
      ? P | BuiltInProviderType
      : BuiltInProviderType
  >,
  options?: SignInOptions,
  authorizationParams?: SignInAuthorizationParams
): Promise<
  P extends RedirectableProviderType ? SignInResponse | undefined : undefined
> {
  if (!provider || !webProviders.includes(provider)) {
    console.log("provider not valid", provider);
    return;
  }

  let signinResult: SigninResult;
  switch (provider) {
    case "github":
      signinResult = await signinGithub();
      break;
    case "discord":
      signinResult = await signinDiscord();
      break;
    default:
      return;
  }
  const {
    result,
    state,
    codeVerifier,
    csrfTokenCookie,
    proxyRedirectUri,
    stateEncrypted,
    provider: nativeProvider,
  } = signinResult;

  if (result.type !== "success") return; // TODO: handle other results

  const { error, sessionToken } = await trpcClient.query("auth.callback", {
    provider: nativeProvider,
    code: result.params.code as string,
    csrfTokenCookie,
    state,
    stateEncrypted,
    callbackUrl: proxyRedirectUri,
    codeVerifier,
  });
  if (error || !sessionToken) {
    switch (error) {
      case "OAuthAccountNotLinked": {
        Alert.alert(
          "Error",
          "The email associated with the account you just logged in is being used by another account. Please log into that account and then link to other providers afterwards."
        );
        break;
      }
    }
    return;
  }
  console.log("sessionToken received in Client", sessionToken);
  await SafeStorage.set(storageKeys.sessionToken, sessionToken);
  await __NEXTAUTH._getSession({ event: "storage" });
}

/**
 * Signs the user out, by removing the session cookie.
 * Automatically adds the CSRF token to the request.
 *
 * [Documentation](https://next-auth.js.org/getting-started/client#signout)
 */
export async function signOut<R extends boolean = true>(
  options?: SignOutParams<R>
): Promise<void> {
  const sessionToken = await SafeStorage.get(storageKeys.sessionToken);
  if (!sessionToken) throw new Error("No sessionToken");

  let csrfToken = await SafeStorage.get(storageKeys.csrfToken);
  if (!csrfToken) {
    csrfToken = (await getCsrfToken())?.csrfTokenCookie ?? null;
  }

  try {
    await trpcClient.mutation("auth.logout", { csrfToken, sessionToken });
  } catch (error) {
    logger.error("CLIENT_SIGNOUT_ERROR", { error: error as Error });
    return;
  }

  await SafeStorage.remove(storageKeys.sessionToken);

  // Trigger session refetch to update AuthContext state.
  await __NEXTAUTH._getSession({ event: "storage" });

  return undefined;
}

/**
 * Provider to wrap the app in to make session data available globally.
 * Can also be used to throttle the number of requests to the endpoint
 * `/api/auth/session`.
 *
 * [Documentation](https://next-auth.js.org/getting-started/client#sessionprovider)
 */
export function SessionProvider(props: SessionProviderProps) {
  const { children, basePath, refetchInterval } = props;

  if (basePath) __NEXTAUTH.basePath = basePath;

  /**
   * If session was `null`, there was an attempt to fetch it,
   * but it failed, but we still treat it as a valid initial value.
   */
  const hasInitialSession = props.session !== undefined;

  /** If session was passed, initialize as already synced */
  __NEXTAUTH._lastSync = hasInitialSession ? now() : 0;

  const [session, setSession] = React.useState(() => {
    if (hasInitialSession) __NEXTAUTH._session = props.session;
    return props.session;
  });

  /** If session was passed, initialize as not loading */
  const [loading, setLoading] = React.useState(!hasInitialSession);

  React.useEffect(() => {
    __NEXTAUTH._getSession = async ({ event } = {}) => {
      try {
        const storageEvent = event === "storage";
        // We should always update if we don't have a client session yet
        // or if there are events from other tabs/windows
        if (storageEvent || __NEXTAUTH._session === undefined) {
          __NEXTAUTH._lastSync = now();
          __NEXTAUTH._session = await getSession({
            broadcast: !storageEvent,
          });
          setSession(__NEXTAUTH._session);
          return;
        }

        if (
          // If there is no time defined for when a session should be considered
          // stale, then it's okay to use the value we have until an event is
          // triggered which updates it
          !event ||
          // If the client doesn't have a session then we don't need to call
          // the server to check if it does (if they have signed in via another
          // tab or window that will come through as a "stroage" event
          // event anyway)
          __NEXTAUTH._session === null ||
          // Bail out early if the client session is not stale yet
          now() < __NEXTAUTH._lastSync
        ) {
          return;
        }

        // An event or session staleness occurred, update the client session.
        __NEXTAUTH._lastSync = now();
        __NEXTAUTH._session = await getSession();
        setSession(__NEXTAUTH._session);
      } catch (error) {
        logger.error("CLIENT_SESSION_ERROR", error as Error);
      } finally {
        setLoading(false);
      }
    };

    __NEXTAUTH._getSession();

    return () => {
      __NEXTAUTH._lastSync = 0;
      __NEXTAUTH._session = undefined;
      __NEXTAUTH._getSession = () => {};
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const { refetchOnWindowFocus = true } = props;
      // Listen for when the page is visible, if the user switches tabs
      // and makes our tab visible again, re-fetch the session, but only if
      // this feature is not disabled.
      if (refetchOnWindowFocus)
        __NEXTAUTH._getSession({ event: "visibilitychange" });
    }, [props])
  );

  React.useEffect(() => {
    // Set up polling
    if (refetchInterval) {
      const refetchIntervalTimer = setInterval(() => {
        if (__NEXTAUTH._session) {
          __NEXTAUTH._getSession({ event: "poll" });
        }
      }, refetchInterval * 1000);
      return () => clearInterval(refetchIntervalTimer);
    }
  }, [refetchInterval]);

  const value: any = React.useMemo(
    () => ({
      data: session,
      status: loading
        ? "loading"
        : session
        ? "authenticated"
        : "unauthenticated",
    }),
    [session, loading]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
