import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Animated,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const WELCOME_SEEN_KEY = "@giftvault:welcome_seen";

type Props = {
  visible: boolean;
  onDismiss: () => void;
};

export function WelcomeCard({ visible, onDismiss }: Props) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  const handleDismiss = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.88,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      await AsyncStorage.setItem(WELCOME_SEEN_KEY, "true");
      onDismiss();
    });
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="none"
      visible={visible}
      onRequestClose={handleDismiss}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.cardWrapper,
            { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <LinearGradient
            colors={["#1E1040", "#2D1B69", "#1A0F3C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            {/* Decorative orbs */}
            <View style={styles.orb1} />
            <View style={styles.orb2} />

            {/* Close button */}
            <Pressable
              onPress={handleDismiss}
              hitSlop={12}
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>

            {/* Icon */}
            <LinearGradient
              colors={["#C084FC", "#F472B6", "#F59E0B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconBadge}
            >
              <Text style={styles.iconEmoji}>🎁</Text>
            </LinearGradient>

            {/* Title */}
            <LinearGradient
              colors={["#C084FC", "#F472B6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.titleGradient}
            >
              <Text style={styles.title}>Surprise, Kutty Papa!!❤️</Text>
            </LinearGradient>

            {/* Message */}
            <Text style={styles.message}>
              This little vault is yours - a place to hold every gift, every
              memory, every small piece of magic between us. But here&#39;s the
              secret tucked inside it: there are 30 days left until your 30th
              birthday, and I couldn&#39;t let a single one slip by without
              celebrating you. Starting tomorrow, a new gift will find its way
              to you every single day, all the way to the big day. Thirty days.
              Thirty gifts. One extraordinary you. Let the countdown begin. ✨
            </Text>

            {/* CTA */}
            <Pressable
              onPress={handleDismiss}
              style={({ pressed }) => [
                styles.ctaWrapper,
                pressed && { opacity: 0.85 },
              ]}
            >
              <LinearGradient
                colors={["#8B5CF6", "#EC4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>Let's go 🚀</Text>
              </LinearGradient>
            </Pressable>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

export async function shouldShowWelcome(): Promise<boolean> {
  try {
    const seen = await AsyncStorage.getItem(WELCOME_SEEN_KEY);
    return seen !== "true";
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  cardWrapper: {
    width: "100%",
    maxWidth: 380,
  },
  card: {
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(192,132,252,0.25)",
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 20,
  },
  orb1: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(192,132,252,0.08)",
    top: -60,
    right: -40,
  },
  orb2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(244,114,182,0.06)",
    bottom: -50,
    left: -30,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  closeBtnText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#C084FC",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  iconEmoji: {
    fontSize: 40,
  },
  titleGradient: {
    borderRadius: 8,
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  message: {
    fontSize: 15,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  ctaWrapper: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  cta: {
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  ctaText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
