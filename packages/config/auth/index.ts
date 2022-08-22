export const nativeProviders = {
  github: "github-expo",
  discord: "discord-expo",
} as const;

export const isValidProvider = (
  k: string
): k is keyof typeof nativeProviders => {
  return k in nativeProviders;
};

export const webProviders = Object.keys(nativeProviders);
