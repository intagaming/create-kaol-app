import { ExpoConfig, ConfigContext } from "@expo/config";

const configFunc = ({}: ConfigContext): ExpoConfig => ({
  name: "kaol-expo",
  slug: "kaol-expo",
  version: "1.0.0",
  sdkVersion: "44.0.0",
  scheme: "kaol-expo",
  platforms: ["ios", "android"],
  ios: {
    bundleIdentifier: "dev.chamatt.kaol",
  },
  android: {
    package: "dev.chamatt.kaol",
  },
  extra: {
    nextAuthUrl: process.env.NEXTAUTH_URL,
  },
});

export default configFunc;
