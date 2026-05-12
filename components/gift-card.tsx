import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { format, parse } from "date-fns";

import { Gift } from "@/lib/types";
import { OccasionBadge } from "@/components/ui/occasion-badge";

const CARD_WIDTH = (Dimensions.get("window").width - 44) / 2;
const CARD_HEIGHT = CARD_WIDTH;

const PLACEHOLDER_GRADIENTS: Record<string, readonly [string, string]> = {
  birthday: ["#EC4899", "#F472B6"],
  anniversary: ["#8B5CF6", "#A78BFA"],
  wedding: ["#F59E0B", "#FCD34D"],
  graduation: ["#3B82F6", "#60A5FA"],
  valentines: ["#F43F5E", "#FB7185"],
  mothers_day: ["#EC4899", "#F9A8D4"],
  fathers_day: ["#6366F1", "#818CF8"],
  other: ["#8B5CF6", "#EC4899"],
};

interface GiftCardProps {
  gift: Gift;
}

export function GiftCard({ gift }: GiftCardProps) {
  const hasPhoto = gift.photos.length > 0;
  const [c1, c2] =
    PLACEHOLDER_GRADIENTS[gift.occasion] ?? PLACEHOLDER_GRADIENTS.other;

  const handlePress = () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/gift/[id]" as any, params: { id: gift.id } });
  };

  const formattedDate = (() => {
    try {
      return format(
        parse(gift.dateReceived, "yyyy-MM-dd", new Date()),
        "MMMM d, yyyy",
      );
    } catch {
      return gift.dateReceived;
    }
  })();

  return (
    <View style={[styles.shadow, { width: CARD_WIDTH }]}>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => (pressed ? styles.pressed : null)}
      >
        <LinearGradient
          colors={[c1, c2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
        >
          {/* Photo overlays the gradient when present */}
          {hasPhoto && (
            <Image
              source={{ uri: gift.photos[0] }}
              style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              contentFit="cover"
              transition={200}
            />
          )}

          {/* Emoji placeholder when no photo */}
          {!hasPhoto && (
            <View style={styles.placeholderInner}>
              <Text style={styles.placeholderEmoji}>🎁</Text>
            </View>
          )}

          {/* Dark gradient overlay at bottom */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.15)", "rgba(0,0,0,0.75)"]}
            locations={[0, 0.45, 1]}
            style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
          />

          {/* Occasion badge — top right */}
          <View style={styles.badge}>
            <OccasionBadge occasion={gift.occasion} size="sm" />
          </View>

          {/* Info — bottom */}
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={2}>
              {gift.title}
            </Text>
            <Text style={styles.date}>{formattedDate}</Text>
            {gift.tags.length > 0 && (
              <Text style={styles.tags} numberOfLines={1}>
                #{gift.tags.slice(0, 2).join(" #")}
              </Text>
            )}
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 20,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    borderRadius: 20,
    // overflow:'hidden' removed — it makes this view a ReactClippingView,
    // which is what Fabric crashes on when the FlatList re-renders. Image
    // children below set their own borderRadius to keep the rounded look.
    // overflow: "hidden",
  },
  pressed: {
    transform: [{ scale: 0.955 }],
    opacity: 0.92,
  },
  placeholderInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderEmoji: {
    fontSize: 44,
  },
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  info: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  date: {
    fontSize: 11,
    color: "rgba(255,255,255,0.72)",
    fontWeight: "500",
  },
  tags: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
    marginTop: 1,
  },
});
