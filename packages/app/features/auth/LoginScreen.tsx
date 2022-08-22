import Button from "app/components/Button";
import { getProviders, signIn } from "app/utils/auth";
import { webProviders } from "config/auth";
import { ClientSafeProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import { View } from "universal";

const LoginScreen = () => {
  const [providers, setProviders] = useState<ClientSafeProvider[]>();

  useEffect(() => {
    (async () => {
      const fetchedProviders = await getProviders();
      if (!fetchedProviders) return;

      // In the Native implementation of signIn(), we will transform these web
      // provider ids into native ones.
      setProviders(
        Object.values(fetchedProviders).filter((p) =>
          webProviders.includes(p.id)
        )
      );
    })();
  }, []);

  return (
    <View className="justify-center flex-1">
      {providers &&
        providers.map((p) => (
          <Button key={p.id} onPress={() => signIn(p.id, { callbackUrl: "/" })}>
            Sign in via {p.name}
          </Button>
        ))}
    </View>
  );
};

export default LoginScreen;
