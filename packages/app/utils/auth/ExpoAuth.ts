import { nativeProviders } from "config/auth";
import * as AuthSession from "expo-auth-session";
import { trpcClient } from "../trpc";
import Constants from "expo-constants";

export type SigninResult = {
  result: AuthSession.AuthSessionResult;
  state: string;
  csrfTokenCookie: string;
  stateEncrypted: string;
  codeVerifier?: string;
  proxyRedirectUri: string;
  provider: string;
};

export const signinGithub = async () => {
  const proxyRedirectUri = AuthSession.makeRedirectUri({ useProxy: true }); // https://auth.expo.io

  // This corresponds to useLoadedAuthRequest
  const request = new AuthSession.AuthRequest({
    clientId: Constants.manifest?.extra?.githubId ?? "",
    scopes: ["read:user", "user:email", "openid"],
    redirectUri: proxyRedirectUri,
    codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
  });
  const discovery = {
    authorizationEndpoint: "https://github.com/login/oauth/authorize",
    tokenEndpoint: "https://github.com/login/oauth/access_token",
    revocationEndpoint:
      "https://github.com/settings/connections/applications/3fbd7538a8f71f47cba1",
  };

  const provider = nativeProviders.github;
  const {
    state,
    codeChallenge,
    csrfTokenCookie,
    stateEncrypted,
    codeVerifier,
  } = await trpcClient.query("auth.signIn", {
    provider,
    proxyRedirectUri,
  });
  request.state = state;
  request.codeChallenge = codeChallenge;
  await request.makeAuthUrlAsync(discovery);

  // useAuthRequestResult
  const result = await request.promptAsync(discovery, { useProxy: true });
  return {
    result,
    state,
    csrfTokenCookie,
    stateEncrypted,
    codeVerifier,
    proxyRedirectUri,
    provider,
  };
};

export const signinDiscord = async () => {
  const proxyRedirectUri = AuthSession.makeRedirectUri({ useProxy: true }); // https://auth.expo.io

  // This corresponds to useLoadedAuthRequest
  const request = new AuthSession.AuthRequest({
    clientId: Constants.manifest?.extra?.discordId ?? "",
    scopes: ["identify", "email"],
    redirectUri: proxyRedirectUri,
    usePKCE: false,
  });
  const discovery = {
    authorizationEndpoint: "https://discord.com/api/oauth2/authorize",
    tokenEndpoint: "https://discord.com/api/oauth2/token",
    revocationEndpoint: "https://discord.com/api/oauth2/token/revoke",
  };

  const provider = nativeProviders.discord;
  const {
    state,
    // codeChallenge,
    csrfTokenCookie,
    stateEncrypted,
    // codeVerifier,
  } = await trpcClient.query("auth.signIn", {
    provider,
    proxyRedirectUri,
    usePKCE: false,
  });
  request.state = state;
  // request.codeChallenge = codeChallenge;
  await request.makeAuthUrlAsync(discovery);

  // useAuthRequestResult
  const result = await request.promptAsync(discovery, { useProxy: true });
  return {
    result,
    state,
    csrfTokenCookie,
    stateEncrypted,
    // codeVerifier,
    proxyRedirectUri,
    provider,
  };
};
