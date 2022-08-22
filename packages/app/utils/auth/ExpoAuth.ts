import * as AuthSession from "expo-auth-session";
import { AppRouter } from "api/src";
import { trpcClient } from "../trpc";
import { providerPairs } from "config/auth";

export type SigninResult = Awaited<ReturnType<typeof signinGithub>>;

export const signinGithub = async () => {
  const proxyRedirectUri = AuthSession.makeRedirectUri({ useProxy: true }); // https://auth.expo.io

  // This corresponds to useLoadedAuthRequest
  const request = new AuthSession.AuthRequest({
    clientId: "3fbd7538a8f71f47cba1", // TODO: move this to env
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

  const provider = providerPairs.github;
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
