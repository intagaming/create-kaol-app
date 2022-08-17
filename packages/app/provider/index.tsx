import { SessionProvider } from "app/utils/auth/Auth";
import { ReactNode } from "react";
import { APIProvider } from "./APIProvider";
import { NavigationProvider } from "./NavigationContainer/NavigationContainer";

// This is the root provider for the app.
// Next.js location: apps/next/pages/_app.tsx
// Expo location: apps/expo/App.tsx

export function Provider({ children }: { children: ReactNode }) {
  return (
    <>
      <APIProvider>
        <NavigationProvider>
          <SessionProvider>{children}</SessionProvider>
        </NavigationProvider>
      </APIProvider>
    </>
  );
}
