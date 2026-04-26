import * as ReactNative from "react-native";

export const SESSION_TOKEN_KEY = "app_session_token";
export const USER_INFO_KEY = "giftvault-user-info";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

/**
 * Derive the API base URL from the current hostname when not explicitly set.
 * Metro runs on 8081/8082/etc, API server runs on 3000.
 */
export function getApiBaseUrl(): string {
  if (API_BASE_URL) return API_BASE_URL.replace(/\/$/, "");

  if (ReactNative.Platform.OS === "web" && typeof window !== "undefined" && window.location) {
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
