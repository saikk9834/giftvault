import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";

type SurpriseCardItem = {
  id: string;
  senderId: number;
  senderName: string;
  senderAvatar?: string | null;
  recipientId: number;
  recipientName: string;
  giftContent: string;
  giftImage?: string | null;
  puzzle: string;
  answer: string;
  deliveryDate: string;
  isUnlocked: boolean;
};

function StatusBadge({
  deliveryDate,
  isUnlocked,
}: {
  deliveryDate: string;
  isUnlocked: boolean;
}) {
  const colors = useColors();
  const delivery = new Date(deliveryDate);
  const available = isPast(delivery) || isToday(delivery);

  if (isUnlocked) {
    return (
      <View
        style={[
          styles.badge,
          { backgroundColor: "#22C55E22", borderColor: "#22C55E44" },
        ]}
      >
        <IconSymbol name="checkmark.circle.fill" size={11} color="#22C55E" />
        <Text style={[styles.badgeText, { color: "#22C55E" }]}>Opened</Text>
      </View>
    );
  }
  if (available) {
    return (
      <View
        style={[
          styles.badge,
          { backgroundColor: "#8B5CF622", borderColor: "#8B5CF644" },
        ]}
      >
        <IconSymbol name="sparkles" size={11} color="#8B5CF6" />
        <Text style={[styles.badgeText, { color: "#8B5CF6" }]}>Ready!</Text>
      </View>
    );
  }
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.surface2, borderColor: colors.border },
      ]}
    >
      <IconSymbol name="clock.fill" size={11} color={colors.muted} />
      <Text style={[styles.badgeText, { color: colors.muted }]}>
        {formatDistanceToNow(delivery, { addSuffix: true })}
      </Text>
    </View>
  );
}

function SurpriseCard({
  item,
  isSentByMe,
  onEdit,
  onDelete,
}: {
  item: SurpriseCardItem;
  isSentByMe?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const colors = useColors();
  const delivery = new Date(item.deliveryDate);
  const available = isPast(delivery) || isToday(delivery);

  const handlePress = () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/surprise/[id]" as any, params: { id: item.id } });
  };

  const personName = isSentByMe ? item.recipientName : item.senderName;
  const label = isSentByMe ? "To" : "From";
  const iconColor = item.isUnlocked
    ? "#22C55E"
    : available
      ? "#8B5CF6"
      : colors.muted;
  const iconName: any = item.isUnlocked
    ? "gift.fill"
    : available
      ? "sparkles"
      : "lock.fill";

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { transform: [{ scale: 0.975 }], opacity: 0.88 },
      ]}
    >
      {/* Top accent strip for available/unlocked */}
      {(available || item.isUnlocked) && (
        <LinearGradient
          colors={
            item.isUnlocked ? ["#22C55E", "#4ADE80"] : ["#8B5CF6", "#EC4899"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardStrip}
        />
      )}

      <View style={styles.cardBody}>
        {/* Avatar column */}
        <View style={styles.avatarWrap}>
          <Avatar name={personName} size={50} />
          <Text style={[styles.labelText, { color: colors.muted }]}>
            {label}
          </Text>
        </View>

        {/* Info column */}
        <View style={styles.cardInfo}>
          <Text
            style={[styles.personName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {personName}
          </Text>
          <Text style={[styles.dateText, { color: colors.muted }]}>
            {format(delivery, "MMMM d, yyyy")}
          </Text>
          <StatusBadge
            deliveryDate={item.deliveryDate}
            isUnlocked={item.isUnlocked}
          />
        </View>

        {/* Right icon */}
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: item.isUnlocked
                ? "#22C55E18"
                : available
                  ? "#8B5CF618"
                  : colors.surface2,
              borderColor: item.isUnlocked
                ? "#22C55E33"
                : available
                  ? "#8B5CF633"
                  : colors.border,
            },
          ]}
        >
          <IconSymbol name={iconName} size={22} color={iconColor} />
        </View>
      </View>

      {/* Sent card actions */}
      {(onEdit || onDelete) && (
        <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
          {onEdit && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onEdit();
              }}
              style={[
                styles.actionChip,
                {
                  borderColor: colors.primary + "44",
                  backgroundColor: colors.primary + "11",
                },
              ]}
            >
              <IconSymbol name="pencil" size={12} color={colors.primary} />
              <Text style={[styles.actionChipText, { color: colors.primary }]}>
                Edit
              </Text>
            </Pressable>
          )}
          {onDelete && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onDelete();
              }}
              style={[
                styles.actionChip,
                { borderColor: "#EF444444", backgroundColor: "#EF444411" },
              ]}
            >
              <IconSymbol name="trash" size={12} color="#EF4444" />
              <Text style={[styles.actionChipText, { color: "#EF4444" }]}>
                Delete
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </Pressable>
  );
}

function SectionEmptyCard({
  emoji,
  text,
  actionLabel,
  onAction,
}: {
  emoji: string;
  text: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.sectionEmpty,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text style={styles.sectionEmptyEmoji}>{emoji}</Text>
      <Text style={[styles.sectionEmptyText, { color: colors.muted }]}>
        {text}
      </Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} style={{ marginTop: 8 }}>
          <Text style={[styles.sectionEmptyAction, { color: colors.primary }]}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default function SurprisesScreen() {
  const colors = useColors();
  const { user, isAuthenticated } = useAuth();

  const utils = trpc.useUtils();
  const { data: rawSurprises = [], refetch } = trpc.surprises.list.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    },
  );
  const deleteSurprise = trpc.surprises.delete.useMutation({
    onSuccess: () => utils.surprises.list.invalidate(),
  });

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) refetch();
    }, [isAuthenticated]),
  );

  const handleDelete = (item: SurpriseCardItem) => {
    const doDelete = () => deleteSurprise.mutate({ id: Number(item.id) });
    if (Platform.OS === "web") {
      if (
        window.confirm(
          `Delete the surprise for ${item.recipientName}? This cannot be undone.`,
        )
      )
        doDelete();
    } else {
      Alert.alert(
        "Delete Surprise",
        `Delete the surprise for ${item.recipientName}?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: doDelete },
        ],
      );
    }
  };

  const toItem = (s: (typeof rawSurprises)[0]): SurpriseCardItem => ({
    ...s,
    id: String(s.id),
    deliveryDate:
      s.deliveryDate instanceof Date
        ? s.deliveryDate.toISOString()
        : String(s.deliveryDate),
  });

  const incoming = useMemo(
    () => rawSurprises.filter((s) => s.recipientId === user?.id).map(toItem),
    [rawSurprises, user],
  );
  const sent = useMemo(
    () => rawSurprises.filter((s) => s.senderId === user?.id).map(toItem),
    [rawSurprises, user],
  );

  const handleSend = () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/send-surprise" as any);
  };

  if (!isAuthenticated) {
    return (
      <ScreenContainer>
        <EmptyState
          emoji="🎁"
          title="Sign in to see surprises"
          subtitle="Send and receive interactive surprise gifts with friends."
          actionLabel="Sign In"
          onAction={() => router.push("/login" as any)}
        />
      </ScreenContainer>
    );
  }

  const readyCount = incoming.filter((s) => {
    const d = new Date(s.deliveryDate);
    return !s.isUnlocked && (isPast(d) || isToday(d));
  }).length;

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Hero */}
        <LinearGradient
          colors={["#831843", "#BE185D", "#EC4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroOrb1} />
          <View style={styles.heroOrb2} />
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroTitle}>Surprises ✨</Text>
              <Text style={styles.heroSub}>
                {incoming.length} incoming · {sent.length} sent
              </Text>
            </View>
            <Pressable
              onPress={handleSend}
              style={({ pressed }) => [
                styles.sendFab,
                pressed && { transform: [{ scale: 0.9 }] },
              ]}
            >
              <LinearGradient
                colors={["rgba(255,255,255,0.35)", "rgba(255,255,255,0.18)"]}
                style={styles.sendFabGradient}
              >
                <IconSymbol name="paperplane.fill" size={20} color="#fff" />
              </LinearGradient>
            </Pressable>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{incoming.length}</Text>
              <Text style={styles.statLabel}>Incoming</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{readyCount}</Text>
              <Text style={styles.statLabel}>Ready</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{sent.length}</Text>
              <Text style={styles.statLabel}>Sent</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Incoming section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>
            Incoming
          </Text>
          {incoming.length === 0 ? (
            <SectionEmptyCard emoji="📭" text="No incoming surprises yet" />
          ) : (
            incoming.map((item) => (
              <SurpriseCard key={item.id} item={item} isSentByMe={false} />
            ))
          )}
        </View>

        {/* Sent section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.muted }]}>
            Sent
          </Text>
          {sent.length === 0 ? (
            <SectionEmptyCard
              emoji="📤"
              text="You haven't sent any surprises yet"
              actionLabel="Send one now →"
              onAction={handleSend}
            />
          ) : (
            sent.map((item) => (
              <SurpriseCard
                key={item.id}
                item={item}
                isSentByMe={true}
                onEdit={
                  item.isUnlocked
                    ? undefined
                    : () =>
                        router.push({
                          pathname: "/edit-surprise/[id]" as any,
                          params: { id: item.id },
                        })
                }
                onDelete={() => handleDelete(item)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 110 },

  hero: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  heroOrb1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -60,
    right: -40,
  },
  heroOrb2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -30,
    left: 20,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.72)",
    marginTop: 4,
    fontWeight: "500",
  },
  sendFab: { borderRadius: 24 },
  sendFabGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  statItem: { flex: 1, alignItems: "center" },
  statNum: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 0.2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cardStrip: { height: 3, width: "100%" },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  avatarWrap: { alignItems: "center", gap: 4 },
  labelText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  cardInfo: { flex: 1, gap: 4 },
  personName: { fontSize: 15, fontWeight: "700" },
  dateText: { fontSize: 12 },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 10, fontWeight: "700" },

  cardActions: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionChipText: { fontSize: 12, fontWeight: "600" },

  sectionEmpty: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    marginBottom: 4,
  },
  sectionEmptyEmoji: { fontSize: 38, marginBottom: 10 },
  sectionEmptyText: { fontSize: 14, fontWeight: "500", textAlign: "center" },
  sectionEmptyAction: { fontSize: 14, fontWeight: "700" },
});
