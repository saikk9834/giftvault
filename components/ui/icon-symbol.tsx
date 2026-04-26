// Android and web icon implementation using MaterialIcons.
// iOS uses icon-symbol.ios.tsx (SF Symbols) instead.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  // Navigation tabs
  "house.fill": "home",
  "gift.fill": "card-giftcard",
  "person.2.fill": "people",
  "person.fill": "person",
  "sparkles": "auto-awesome",

  // Actions
  "paperplane.fill": "send",
  "plus": "add",
  "plus.circle.fill": "add-circle",
  "magnifyingglass": "search",
  "slider.horizontal.3": "tune",
  "arrow.left": "arrow-back",
  "xmark": "close",
  "xmark.circle.fill": "cancel",
  "checkmark": "check",
  "checkmark.circle.fill": "check-circle",
  "pencil": "edit",
  "trash": "delete",
  "square.and.arrow.up": "share",
  "camera.fill": "camera-alt",
  "photo.fill": "photo-library",
  "photo.on.rectangle": "photo-library",
  "calendar": "calendar-today",
  "tag.fill": "label",
  "lock.fill": "lock",
  "lock.open.fill": "lock-open",
  "bell.fill": "notifications",
  "gear": "settings",
  "moon.fill": "dark-mode",
  "envelope.fill": "email",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "chevron.left.forwardslash.chevron.right": "code",
  "ellipsis": "more-horiz",
  "star.fill": "star",
  "heart.fill": "favorite",
  "clock.fill": "schedule",
  "person.badge.plus": "person-add",
  "link": "link",
  "info.circle": "info",
  "rectangle.portrait.and.arrow.right": "logout",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: string;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name] ?? "help-outline"} style={style} />;
}
