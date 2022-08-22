import { Button } from "app/components/Button";
import { signIn } from "app/utils/auth";
import { Text, View } from "universal";

const LoginScreen = () => {
  return (
    <View className="justify-center flex-1">
      <Button onPress={() => signIn("github", { callbackUrl: "/" })}>
        Sign in via GitHub
      </Button>
    </View>
  );
};

export default LoginScreen;
