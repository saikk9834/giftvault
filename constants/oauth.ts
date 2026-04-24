import * as Linking from "expo-linking";
import * as ReactNative from "react-native";
import * as WebBrowser from "expo-web-browser";

// Extract scheme from bundle ID (last segment timestamp, prefixed with "manus")
// e.g., "space.manus.my.app.t20240115103045" -> "manus20240115103045"
const bundleId = "space.manus.giftvault.t20260424094341";
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

const env = {
  portal: process.env.EXPO_PUBLIC_OAUTH_PORTAL_URL ?? "",
  server: process.env.EXPO_PUBLIC_OAUTH_SERVER_URL ?? "",
  appId: process.env.EXPO_PUBLIC_APP_ID ?? "",
  ownerId: process.env.EXPO_PUBLIC_OWNER_OPEN_ID ?? "",
  ownerName: process.env.EXPO_PUBLIC_OWNER_NAME ?? "",
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  deepLinkScheme: schemeFromBundleId,
};

export const OAUTH_PORTAL_URL = env.portal;
export const OAUTH_SERVER_URL = env.server;
export const APP_ID = env.appId;
export const OWNER_OPEN_ID = env.ownerId;
export const OWNER_NAME = env.ownerName;
export const API_BASE_URL = env.apiBaseUrl;

/**
 * Get the API base URL, deriving from current hostname if not set.
 * Metro runs on 8081, API server runs on 3000.
 * URL pattern: https://PORT-sandboxid.region.domain
 */
export function getApiBaseUrl(): string {
  // If API_BASE_URL is set, use it
  if (API_BASE_URL) {
    return API_BASE_URL.replace(/\/$/, "");
  }

  // On web, derive from current hostname by replacing port 8081 with 3000
  if (ReactNative.Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    const { protocol, hostname } = window.location;
    // Pattern: 8081-sandboxid.region.domain -> 3000-sandboxid.region.domain
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    if (apiHostname !== hostname) {
      return `${protocol}//${apiHostname}`;
    }
  }

  // Fallback to empty (will use relative URL)
  return "";
}

export const SESSION_TOKEN_KEY = "app_session_token";
export const USER_INFO_KEY = "manus-runtime-user-info";

const encodeState = (value: string) => {
  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(value);
  }
  const BufferImpl = (globalThis as Record<string, any>).Buffer;
  if (BufferImpl) {
    return BufferImpl.from(value, "utf-8").toString("base64");
  }
  return value;
};

/**
 * Get the redirect URI for OAuth callback.
 * - Web: uses API server callback endpoint (HTTPS, accepted by OAuth portal)
 * - Native: uses the HTTPS /api/oauth/mobile endpoint which then redirects back
 *   to the app via the manus:// deep link. This is required because the OAuth
 *   portal only accepts http/https/manus schemes — not manus20260424094341://.
 */
export const getRedirectUri = (isNative = false) => {
  if (ReactNative.Platform.OS === "web" && !isNative) {
    return `${getApiBaseUrl()}/api/oauth/callback`;
  } else {
    // Use the HTTPS server endpoint as the redirect URI (portal accepts https://)
    // The server will then redirect back to the app via manus:// deep link
    const apiBase = getApiBaseUrl();
    return `${apiBase}/api/oauth/mobile?redirect=1&scheme=${encodeURIComponent(env.deepLinkScheme)}`;
  }
};

export const getLoginUrl = (isNative = false) => {
  const redirectUri = getRedirectUri(isNative);
  const state = encodeState(redirectUri);

  const url = new URL(`${OAUTH_PORTAL_URL}/app-auth`);
  url.searchParams.set("appId", APP_ID);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};

/**
 * Start OAuth login flow.
 *
 * On native platforms (iOS/Android), uses WebBrowser.openAuthSessionAsync so the
 * OAuth portal can redirect back to the app via the registered manus:// deep link scheme.
 *
 * On web, this simply redirects to the login URL.
 *
 * @returns Always null, the callback is handled via deep link / page redirect.
 */
export async function startOAuthLogin(): Promise<string | null> {
  if (ReactNative.Platform.OS === "web") {
    // On web, use the standard web login URL (HTTPS redirect to /api/oauth/callback)
    const loginUrl = getLoginUrl(false);
    if (typeof window !== "undefined") {
      window.location.href = loginUrl;
    }
    return null;
  }

  // On native: use HTTPS server endpoint as redirectUri (portal accepts https://)
  // The server exchanges the code and redirects back to the app via manus:// deep link
  const loginUrl = getLoginUrl(true);
  const deepLinkPrefix = `${env.deepLinkScheme}://`;

  console.log("[OAuth] Native login URL:", loginUrl);
  console.log("[OAuth] Waiting for deep link prefix:", deepLinkPrefix);

  try {
    // openAuthSessionAsync opens an in-app browser and watches for a redirect
    // to a URL starting with deepLinkPrefix, then closes the browser and returns it.
    const result = await WebBrowser.openAuthSessionAsync(loginUrl, deepLinkPrefix);
    console.log("[OAuth] Auth session result:", result.type);

    if (result.type === "success" && result.url) {
      console.log("[OAuth] Deep link received:", result.url);
      // Let Expo Router handle the deep link (routes to /oauth/callback)
      await Linking.openURL(result.url);
    } else if (result.type === "cancel" || result.type === "dismiss") {
      console.log("[OAuth] Auth session cancelled by user");
    }
  } catch (error) {
    console.error("[OAuth] Failed to open auth session:", error);
  }

  return null;
}
