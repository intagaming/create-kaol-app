import { Button } from "app/components/Button";
import { EnvironmentStatusBar } from "app/components/EnvironmentStatusBar";
import { trpc } from "app/utils/trpc";
import { TextLink } from "solito/link";
import { Text, View } from "universal";

export function HomeScreen() {
  const hello = trpc.useQuery(["example.hello", { text: "from Kaol" }]);
  // const { data: secretMessage, isLoading } = trpc.useQuery([
  //   "protected.getSecretMessage",
  // ]);

  return (
    <View className="flex-1">
      <EnvironmentStatusBar />

      <View className="items-center justify-center flex-1 p-4">
        <Text className="items-center text-3xl font-extrabold text-center">
          Welcome to Kaol.
        </Text>

        <Text className="items-center text-3xl font-extrabold text-center">
          {hello.data ? (
            <Text>{hello.data.greeting}</Text>
          ) : (
            <Text>Loading..</Text>
          )}
          {/* {secretMessage && <Text>{secretMessage}</Text>} */}
        </Text>

        <Button onPress={() => {}}>Sign in</Button>

        <View className="my-8 max-w-base">
          <Text className="mb-4 text-center">
            Here is a basic starter to show you how you can navigate from one
            screen to another. This screen uses the same code on Next.js and
            React Native.
          </Text>
          <Text className="text-center " tw="">
            Kaol is made by{" "}
            <TextLink href="https://github.com/chamatt">@chamatt</TextLink>.
          </Text>
        </View>
      </View>
    </View>
  );
}
