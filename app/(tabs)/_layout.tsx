import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View, Text, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const TAB_CONFIG = [
  { name: "index",     label: "Vault",     icon: "gift.fill"    },
  { name: "surprises", label: "Surprises", icon: "sparkles"      },
  { name: "friends",   label: "Friends",   icon: "person.2.fill" },
  { name: "profile",   label: "Profile",   icon: "person.fill"   },
] as const;

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.outerContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.bar,
          { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.foreground },
        ]}
      >
        {state.routes.map((route, index) => {
          const tab = TAB_CONFIG.find((t) => t.name === route.name);
          if (!tab) return null;
          const isFocused = state.index === index;

          const handlePress = () => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (!isFocused) navigation.navigate(route.name);
          };

          return (
            <Pressable key={route.key} onPress={handlePress} style={styles.tab}>
              {isFocused ? (
                <LinearGradient
                  colors={["#8B5CF6", "#EC4899"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.activeTab}
                >
                  <IconSymbol name={tab.icon as any} size={20} color="#fff" />
                  <Text style={styles.activeLabel}>{tab.label}</Text>
                </LinearGradient>
              ) : (
                <View style={styles.inactiveTab}>
                  <IconSymbol name={tab.icon as any} size={22} color={colors.muted} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingTop: 8,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 40,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  tab: { alignItems: "center", justifyContent: "center" },
  activeTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
  },
  activeLabel: { color: "#fff", fontSize: 13, fontWeight: "700", letterSpacing: 0.2 },
  inactiveTab: { width: 52, height: 44, alignItems: "center", justifyContent: "center" },
});

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label }} />
      ))}
    </Tabs>
  );
}
