import MainStack from "./MainStack";
import { routes } from "../routePaths";

export const INITIAL_ROUTE = routes.home.name;

export const NativeNavigation = () => {
  return <MainStack />;
};
