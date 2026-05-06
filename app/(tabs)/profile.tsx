import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Linking,
  Platform,
  Switch,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Avatar } from "@/components/ui/avatar";
import { useColors } from "@/hooks/use-colors";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  rightElement,
  iconBg,
  iconColor,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
}) {
  const colors = useColors();
  const bg = iconBg ?? colors.primary + "20";
  const ic = iconColor ?? colors.primary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { backgroundColor: colors.surface },
        pressed && onPress && { opacity: 0.72 },
      ]}
    >
      <View style={styles.settingsRow}>
        <View style={[styles.settingsIcon, { backgroundColor: bg }]}>
          <IconSymbol name={icon as any} size={17} color={ic} />
        </View>
        <Text
          style={[styles.settingsLabel, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <View style={styles.settingsRight}>
          {value && (
            <Text style={[styles.settingsValue, { color: colors.muted }]}>
              {value}
            </Text>
          )}
          {rightElement}
          {onPress && !rightElement && (
            <IconSymbol name="chevron.right" size={15} color={colors.muted} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name ?? "");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const checkNotificationPermission = useCallback(async () => {
    if (Platform.OS === "web") return;
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(status === "granted");
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkNotificationPermission();
    }, [checkNotificationPermission])
  );

  const handleNotificationToggle = async (value: boolean) => {
    if (Platform.OS === "web") return;
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationsEnabled(status === "granted");
      if (status !== "granted") Linking.openSettings();
    } else {
      Linking.openSettings();
    }
  };

  const { data: gifts = [] } = trpc.gifts.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: surprises = [] } = trpc.surprises.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: friendsList = [] } = trpc.friends.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const stats = {
    gifts: gifts.length,
    surprisesSent: surprises.filter((s) => s.senderId === user?.id).length,
    surprisesReceived: surprises.filter((s) => s.recipientId === user?.id)
      .length,
    friends: friendsList.filter((f) => f.status === "accepted").length,
  };

  const displayName = user?.name ?? "GiftVault User";
  const username = user?.email?.split("@")[0] ?? "user";

  const handleSaveName = async () => {
    setEditingName(false);
    if (Platform.OS !== "web")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleLogout = () => {
    const doLogout = async () => {
      try {
        await logout();
        if (Platform.OS !== "web")
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/login" as any);
      } catch {
        if (Platform.OS === "web")
          window.alert("Failed to sign out. Please try again.");
        else Alert.alert("Error", "Failed to sign out. Please try again.");
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to sign out?")) doLogout();
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: doLogout },
      ]);
    }
  };

  if (!isAuthenticated) {
    return (
      <ScreenContainer>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <Text
            style={{
              color: colors.foreground,
              fontSize: 20,
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            Sign in to GiftVault
          </Text>
          <Text
            style={{
              color: colors.muted,
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            Create an account to sync your gifts and send surprises to friends.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile hero */}
        <LinearGradient
          colors={["#4C1D95", "#6D28D9", "#9333EA"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {/* Orb decorations */}
          <View style={styles.heroOrb1} />
          <View style={styles.heroOrb2} />

          {/* Avatar + name */}
          <View style={styles.heroTop}>
            <Avatar name={displayName} size={76} />
            {editingName ? (
              <View style={styles.nameEditRow}>
                <TextInput
                  value={newName}
                  onChangeText={setNewName}
                  style={styles.nameInput}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                  placeholderTextColor="rgba(255,255,255,0.5)"
                />
                <Pressable onPress={handleSaveName} style={styles.saveNameBtn}>
                  <IconSymbol name="checkmark" size={16} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setEditingName(true)}
                style={styles.nameRow}
              >
                <Text style={styles.displayName}>{displayName}</Text>
                <IconSymbol
                  name="pencil"
                  size={13}
                  color="rgba(255,255,255,0.55)"
                />
              </Pressable>
            )}
            <Text style={styles.username}>@{username}</Text>
          </View>

          {/* Stats inside hero */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.gifts}</Text>
              <Text style={styles.statLabel}>Gifts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.surprisesSent}</Text>
              <Text style={styles.statLabel}>Sent</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.surprisesReceived}</Text>
              <Text style={styles.statLabel}>Received</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{stats.friends}</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Preferences */}
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>
          Preferences
        </Text>
        <View style={[styles.settingsGroup, { borderColor: colors.border }]}>
          <SettingsRow
            icon="bell.fill"
            label="Notifications"
            iconBg="#8B5CF620"
            iconColor="#8B5CF6"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ true: "#8B5CF6", false: colors.border }}
                thumbColor="#fff"
              />
            }
          />
          <View
            style={[styles.rowDivider, { backgroundColor: colors.border }]}
          />
          <SettingsRow
            icon="moon.fill"
            label="Dark Mode"
            iconBg="#6366F120"
            iconColor="#6366F1"
            value={colorScheme === "dark" ? "On" : "Off"}
          />
        </View>

        {/* About */}
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>
          About
        </Text>
        <View style={[styles.settingsGroup, { borderColor: colors.border }]}>
          <SettingsRow
            icon="info.circle"
            label="Version"
            iconBg="#0EA5E920"
            iconColor="#0EA5E9"
            value="1.0.0"
          />
          <View
            style={[styles.rowDivider, { backgroundColor: colors.border }]}
          />
          <SettingsRow
            icon="star.fill"
            label="Rate GiftVault"
            iconBg="#F59E0B20"
            iconColor="#F59E0B"
            onPress={() =>
              Alert.alert(
                "Thank you!",
                "Your feedback means the world to us. 💜",
              )
            }
          />
          <View
            style={[styles.rowDivider, { backgroundColor: colors.border }]}
          />
          <SettingsRow
            icon="square.and.arrow.up"
            label="Share App"
            iconBg="#22C55E20"
            iconColor="#22C55E"
            onPress={() =>
              Alert.alert("Share", "giftvault.app — Share the love!")
            }
          />
        </View>

        {/* Sign Out */}
        <View style={styles.signOutSection}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.signOutBtn,
              pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
            ]}
          >
            <LinearGradient
              colors={["#EF444411", "#EF444418"]}
              style={styles.signOutGradient}
            >
              <IconSymbol
                name="rectangle.portrait.and.arrow.right"
                size={18}
                color="#EF4444"
              />
              <Text style={styles.signOutText}>Sign Out</Text>
            </LinearGradient>
          </Pressable>
          <Text style={[styles.signOutHint, { color: colors.muted }]}>
            Signed in as {user?.email ?? user?.name ?? "you"}
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 120 },

  hero: {
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
    overflow: "hidden",
    gap: 0,
  },
  heroOrb1: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.05)",
    top: -70,
    right: -50,
  },
  heroOrb2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -30,
    left: 30,
  },
  heroTop: {
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  displayName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  username: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.6)",
  },
  nameEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  nameInput: {
    borderBottomWidth: 2,
    borderBottomColor: "rgba(255,255,255,0.6)",
    fontSize: 22,
    fontWeight: "700",
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 160,
    textAlign: "center",
    color: "#fff",
  },
  saveNameBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  statItem: { flex: 1, alignItems: "center" },
  statNum: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 0.2,
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 20,
  },
  settingsGroup: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 0,
    gap: 12,
  },
  settingsIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsLabel: { flex: 1, fontSize: 15, fontWeight: "500" },
  settingsRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  settingsValue: { fontSize: 14 },
  rowDivider: { height: StyleSheet.hairlineWidth, marginLeft: 60 },

  signOutSection: {
    marginHorizontal: 10,
    marginTop: 20,
    gap: 12,
    alignItems: "center",
  },
  signOutBtn: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EF444433",
  },
  signOutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  signOutText: { fontSize: 16, fontWeight: "700", color: "#EF4444" },
  signOutHint: { fontSize: 12 },
});
