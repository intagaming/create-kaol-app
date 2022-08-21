import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "app/features/auth/LoginScreen";

import { HomeScreen } from "../../features/home/home-screen";
import { routes, RouteTypes } from "../routePaths";

const Stack = createNativeStackNavigator<Pick<RouteTypes, "home" | "login">>();

export function MainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={routes.home.name}
        component={HomeScreen}
        options={{
          title: "Home",
        }}
      />
      <Stack.Screen
        name={routes.login.name}
        component={LoginScreen}
        options={{
          title: "Login",
        }}
      />
    </Stack.Navigator>
  );
}
