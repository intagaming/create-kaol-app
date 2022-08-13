// @generated: @expo/next-adapter@3.1.21
// Learn more: https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/guides/using-nextjs.md#shared-steps

module.exports = {
  presets: [
    "@expo/next-adapter/babel",
    ["babel-preset-expo", { jsxRuntime: "automatic" }],
  ],
  plugins: [
    ["@babel/plugin-proposal-class-properties", { loose: true }],
    ["@babel/plugin-proposal-private-methods", { loose: true }],
    ["@babel/plugin-proposal-private-property-in-object", { loose: true }],
    "react-native-reanimated/plugin",
  ],
};
