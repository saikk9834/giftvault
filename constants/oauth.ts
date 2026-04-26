import * as ReactNative from "react-native";
import Constants from "expo-constants";

export const SESSION_TOKEN_KEY = "app_session_token";
export const USER_INFO_KEY = "giftvault-user-info";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

/**
 * Derive the API base URL from the current hostname when not explicitly set.
 * Metro runs on 8081/8082/etc, API server runs on 3000.
 *
 * On native (iOS/Android), derive from Constants.expoConfig.hostUri which
 * Expo sets to the Metro server IP:port when connected via QR code / dev client.
 */
export function getApiBaseUrl(): string {
  if (API_BASE_URL) return API_BASE_URL.replace(/\/$/, "");

  // Native dev client: Metro hostUri is e.g. "192.168.1.5:8081"
  if (ReactNative.Platform.OS !== "web") {
    const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest?.debuggerHost;
    if (hostUri) {
      const host = hostUri.split(":")[0]; // strip the Metro port
      return `http://${host}:3000`;
    }
  }

  // Web: derive from window.location
  if (typeof window !== "undefined" && window.location) {
    const { protocol, hostname, port } = window.location;

    // Cloud/tunnel hosting: port encoded in subdomain (e.g. 8081-xxx.host -> 3000-xxx.host)
    const apiHostname = hostname.replace(/^\d+(-|$)/, "3000$1");
    if (apiHostname !== hostname) return `${protocol}//${apiHostname}`;

    // Localhost: swap whatever port Metro is on to 3000
    if (hostname === "localhost" && port && port !== "3000") {
      return `${protocol}//localhost:3000`;
    }
  }

  return "";
}
