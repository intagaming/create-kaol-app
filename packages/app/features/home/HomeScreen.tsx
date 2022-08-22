import Button from "app/components/Button";
import EnvironmentStatusBar from "app/components/EnvironmentStatusBar";
import { routes } from "app/navigation/routePaths";
import { signOut, useSession } from "app/utils/auth";
import { trpc } from "app/utils/trpc";
import { Link, TextLink } from "solito/link";
import { Text, View } from "universal";

const AuthComponent = () => {
  const { data: secretMessage } = trpc.useQuery(["protected.getSecretMessage"]);

  return (
    <View className="items-center">
      <Button onPress={() => signOut()}>Logout</Button>
      {secretMessage && (
        <Text className="items-center text-3xl font-extrabold text-center">
          <Text>Secret message: {secretMessage}</Text>
        </Text>
      )}
    </View>
  );
};

export default function HomeScreen() {
  const hello = trpc.useQuery(["example.hello", { text: "from Kaol" }]);
  const { data, status } = useSession();

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
        </Text>

        <Text className="items-center text-3xl font-extrabold text-center">
          <Text>
            Auth status: {status}.
            {status === "authenticated" && (
              <Text>You are {data?.user?.name}.</Text>
            )}
          </Text>
        </Text>

        {status === "authenticated" && <AuthComponent />}

        {status === "unauthenticated" && (
          <Link href={routes.login.getPath()}>
            <View className="p-2 border rounded-md">
              <Text>Login</Text>
            </View>
          </Link>
        )}

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
