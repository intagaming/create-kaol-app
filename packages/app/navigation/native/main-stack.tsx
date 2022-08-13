import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { HomeScreen } from "../../features/home/home-screen";
import { routes, RouteTypes } from "../routePaths";

const Stack = createNativeStackNavigator<Pick<RouteTypes, "home">>();

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
    </Stack.Navigator>
  );
}
