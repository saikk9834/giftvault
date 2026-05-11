import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Occasion, OCCASIONS } from "@/lib/types";

interface OccasionBadgeProps {
  occasion: Occasion;
  size?: "sm" | "md";
}

const OCCASION_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  birthday: { bg: "#FDF2F8", text: "#BE185D", border: "#FBCFE8" },
  anniversary: { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
  wedding: { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  graduation: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  valentines: { bg: "#FFF1F2", text: "#E11D48", border: "#FECDD3" },
  mothers_day: { bg: "#FDF2F8", text: "#9D174D", border: "#F9A8D4" },
  fathers_day: { bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE" },
  other: { bg: "#F5F3FF", text: "#7C3AED", border: "#DDD6FE" },
};
export function OccasionBadge({ occasion, size = "sm" }: OccasionBadgeProps) {
  const info =
    OCCASIONS.find((o) => o.value === occasion) ??
    OCCASIONS[OCCASIONS.length - 1];
  const isSmall = size === "sm";

  // Use light colors by default (dark mode overrides via border/bg are handled at component level)
  const colorSet = OCCASION_COLORS[occasion] ?? OCCASION_COLORS.other;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colorSet.bg,
          borderColor: colorSet.border,
          paddingHorizontal: isSmall ? 6 : 10,
          paddingVertical: isSmall ? 2 : 5,
        },
      ]}
    >
      <Text style={[styles.emoji, { fontSize: isSmall ? 10 : 13 }]}>
        {info.emoji}
      </Text>
      <Text
        style={[
          styles.label,
          { color: colorSet.text, fontSize: isSmall ? 10 : 12 },
        ]}
      >
        {info.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    gap: 3,
  },
  emoji: {
    lineHeight: 16,
  },
  label: {
    fontWeight: "700",
    letterSpacing: 0.1,
  },
});
