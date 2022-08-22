import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "app/features/auth/LoginScreen";
import { useSession } from "app/utils/auth";

import HomeScreen from "../../features/home/HomeScreen";
import { routes, RouteTypes } from "../routePaths";

const Stack = createNativeStackNavigator<Pick<RouteTypes, "home" | "login">>();

export default function MainStack() {
  const { status } = useSession();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name={routes.home.name}
        component={HomeScreen}
        options={{
          title: "Home",
        }}
      />
      {status === "unauthenticated" && (
        <Stack.Screen
          name={routes.login.name}
          component={LoginScreen}
          options={{
            title: "Login",
          }}
        />
      )}
    </Stack.Navigator>
  );
}
