import { createRoutes } from "./utils";

// Define the params of EVERY route in the app
export type RouteTypes = {
  home: undefined;
  login: undefined;
  // postDetail: { id: string };
  // postList: undefined;
  // signUp: undefined;
};

// Then define the mapping between screen and URL
// PS: The getPath params are fully typed according to the NavigationTypes
export const routes = createRoutes({
  home: {
    route: "",
    getPath: () => "/",
  },
  login: {
    route: "/login",
    getPath: () => "/login",
  },
  // postDetail: {
  //   route: "/posts/:id",
  //   getPath: ({ id }) => `/posts/${id}`,
  // },
  // postList: {
  //   route: "/posts",
  //   getPath: () => "/posts",
  // },
  // signUp: {
  //   route: "/auth/signup",
  //   getPath: () => "/auth/signup",
  // },
});
