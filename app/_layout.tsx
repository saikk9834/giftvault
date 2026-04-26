import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
import { useFonts } from "expo-font";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ThemeProvider } from "@/lib/theme-provider";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { usePushNotifications } from "@/hooks/use-push-notifications";

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

function PushNotificationBootstrap() {
  const { isAuthenticated } = useAuth();
  usePushNotifications(isAuthenticated);
  return null;
}

export default function RootLayout() {
  const insets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const frame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  // Kick off font loading — don't block rendering on it.
  // Expo Router manages the splash screen; blocking here (return null) causes
  // the app to freeze if the font load stalls for any reason.
  useFonts(MaterialIcons.font);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  const [trpcClient] = useState(() => createTRPCClient());

  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets, frame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [insets, frame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <PushNotificationBootstrap />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="login"
              options={{ presentation: "fullScreenModal", animation: "fade" }}
            />
            <Stack.Screen
              name="gift/[id]"
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="surprise/[id]"
              options={{ animation: "slide_from_right" }}
            />
            <Stack.Screen
              name="add-gift"
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="send-surprise"
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="edit-surprise/[id]"
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
          </Stack>
          <StatusBar style="light" />
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );

  if (Platform.OS === "web") {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>
        {content}
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
