import "@/global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
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

// Must be called before any rendering — keep at module level, after all imports.
SplashScreen.preventAutoHideAsync().catch(() => {});

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = { anchor: "(tabs)" };

function PushNotificationBootstrap() {
  const { isAuthenticated } = useAuth();
  usePushNotifications(isAuthenticated);
  return null;
}

export default function RootLayout() {
  const insets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const frame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  // MaterialIcons.font is { material: <ttf asset> } — the canonical, library-
  // provided config. The icon component checks Font.isLoaded('material') before
  // rendering; using any other key (e.g. 'MaterialIcons') leaves it false and
  // every icon renders as an empty <Text />.
  const [fontsLoaded] = useFonts(MaterialIcons.font);

  // Hide splash as soon as fonts load (fast path).
  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  // Safety net: never let the app hang on splash. Hide after 2s no matter what.
  useEffect(() => {
    const t = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 2000);
    return () => clearTimeout(t);
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false, retry: 1 },
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

  // Do NOT block on fontsLoaded. If the font fails (or is slow), icons render
  // briefly as empty text but the app always opens. Splash hides via the
  // safety effect above. Blocking caused prior splash-screen deadlocks.

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <PushNotificationBootstrap />
          <Stack screenOptions={{ headerShown: false, animation: "slide_from_bottom" }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" options={{ presentation: "fullScreenModal", animation: "fade" }} />
            <Stack.Screen name="gift/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="surprise/[id]" options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="add-gift" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
            <Stack.Screen name="send-surprise" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
            <Stack.Screen name="edit-surprise/[id]" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
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
