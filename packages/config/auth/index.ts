export const providerPairs = {
  github: "github-expo",
  "github-expo": "github",
} as const;
export const isValidProvider = (k: string): k is keyof typeof providerPairs => {
  return k in providerPairs;
};

export const webProviders = ["github"];
