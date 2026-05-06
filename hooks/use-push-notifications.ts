/**
 * usePushNotifications
 *
 * Handles the full client-side push notification lifecycle:
 * 1. Requests permission from the user
 * 2. Gets the Expo push token
 * 3. Registers the token with the server
 * 4. Sets up the Android notification channel
 * 5. Returns the token and a cleanup function
 *
 * Call this hook once in the root layout after the user is authenticated.
 */
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { trpc } from '@/lib/trpc';

// Show notifications even when the app is in the foreground (native only)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  console.log('[Push] Starting registration. isDevice:', Device.isDevice, 'platform:', Platform.OS);

  if (!Device.isDevice) {
    console.warn('[Push] Not a physical device — skipping token registration');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('surprises', {
      name: 'Surprise Gifts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C084FC',
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  console.log('[Push] Existing permission status:', existingStatus);

  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log('[Push] Requested permission, result:', status);
  }

  if (finalStatus !== 'granted') {
    console.warn('[Push] Permission denied — notifications will not work. Go to Android Settings → Apps → GiftVault → Notifications and enable them.');
    return null;
  }

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    console.log('[Push] EAS projectId:', projectId ?? 'NOT FOUND');

    if (!projectId) {
      console.warn('[Push] No EAS projectId — rebuild the app via EAS to fix this');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[Push] Token obtained:', tokenData.data);
    return tokenData.data;
  } catch (err) {
    console.warn('[Push] Failed to get push token:', err);
    return null;
  }
}

export function usePushNotifications(isAuthenticated: boolean) {
  const tokenRef = useRef<string | null>(null);
  const registerToken = trpc.notifications.registerToken.useMutation();

  useEffect(() => {
    if (!isAuthenticated || Platform.OS === 'web') return;

    let mounted = true;

    registerForPushNotificationsAsync().then((token) => {
      if (!mounted) return;
      if (!token) {
        console.warn('[Push] No token returned — registration aborted');
        return;
      }
      tokenRef.current = token;
      const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
      console.log('[Push] Registering token with server, platform:', platform);
      registerToken.mutate({ token, platform }, {
        onSuccess: () => console.log('[Push] Token saved to server successfully'),
        onError: (err) => console.error('[Push] Failed to save token to server:', err),
      });
    });

    // Handle notification taps — deep link to the surprise screen
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url;
      if (typeof url === 'string') {
        router.push(url as any);
      }
    });

    // Handle the case where the app was launched from a notification
    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse?.notification) {
      const url = lastResponse.notification.request.content.data?.url;
      if (typeof url === 'string') {
        // Delay slightly to let the navigation stack mount
        setTimeout(() => router.push(url as any), 500);
      }
    }

    return () => {
      mounted = false;
      responseListener.remove();
    };
  }, [isAuthenticated]);

  return { pushToken: tokenRef.current };
}
