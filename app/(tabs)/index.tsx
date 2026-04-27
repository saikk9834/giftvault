import React, { useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { GiftCard } from "@/components/gift-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { EmptyState } from "@/components/ui/empty-state";
import { useColors } from "@/hooks/use-colors";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { GiftFilters, Occasion, OCCASIONS, GiftSortKey } from "@/lib/types";
import { applyFilters } from "@/lib/store/gift-store";

const SORT_OPTIONS: { key: GiftSortKey; label: string }[] = [
  { key: "date_desc", label: "Newest" },
  { key: "date_asc", label: "Oldest" },
  { key: "name_asc", label: "A → Z" },
  { key: "name_desc", label: "Z → A" },
];

const DEFAULT_FILTERS: GiftFilters = {
  search: "",
  occasion: "all",
  tags: [],
  sortKey: "date_desc",
};

export default function VaultScreen() {
  const colors = useColors();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [filters, setFilters] = useState<GiftFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef<TextInput>(null);

  const {
    data: rawGifts = [],
    isLoading,
    refetch,
  } = trpc.gifts.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const allGifts = useMemo(
    () =>
      rawGifts.map((g) => ({
        ...g,
        id: String(g.id),
        photos: (() => {
          try {
            return JSON.parse(g.photos ?? "[]") ?? [];
          } catch {
            return [];
          }
        })(),
        tags: (() => {
          try {
            return JSON.parse(g.tags ?? "[]") ?? [];
          } catch {
            return [];
          }
        })(),
        notes: g.notes ?? undefined,
      })),
    [rawGifts],
  );

  const filteredGifts = useMemo(
    () => applyFilters(allGifts as any, filters),
    [allGifts, filters],
  );
  console.log("[Vault]", {
    rawCount: rawGifts.length,
    allCount: allGifts.length,
    filteredCount: filteredGifts.length,
    ids: filteredGifts.map((g) => g.id),
  });

  const updateFilter = <K extends keyof GiftFilters>(
    key: K,
    value: GiftFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddGift = () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/add-gift" as any);
  };

  if (authLoading) {
    return (
      <ScreenContainer>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </ScreenContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <ScreenContainer>
        <EmptyState
          emoji="🔐"
          title="Sign in to access your vault"
          subtitle="Your gifts are stored securely in the cloud. Sign in to view them."
          actionLabel="Sign In"
          onAction={() => router.push("/login" as any)}
        />
      </ScreenContainer>
    );
  }

  const totalGifts = allGifts.length;
  const thisYearGifts = allGifts.filter(
    (g) => new Date(g.dateReceived).getFullYear() === new Date().getFullYear(),
  ).length;
  const occasionCount = new Set(allGifts.map((g) => g.occasion)).size;
  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <ScreenContainer>
      {isLoading ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredGifts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <GiftCard gift={item as any} />}
          ListEmptyComponent={
            <EmptyState
              emoji="🎁"
              title={
                allGifts.length === 0 ? "Your vault is empty" : "No gifts found"
              }
              subtitle={
                allGifts.length === 0
                  ? "Start logging the gifts you receive and build your memory vault."
                  : "Try adjusting your search or filters."
              }
              actionLabel={allGifts.length === 0 ? "Add First Gift" : undefined}
              onAction={allGifts.length === 0 ? handleAddGift : undefined}
            />
          }
          ListHeaderComponent={
            <View>
              {/* Hero header */}
              <LinearGradient
                colors={["#4C1D95", "#7C3AED", "#9333EA"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.hero}
              >
                <View style={styles.heroOrb1} />
                <View style={styles.heroOrb2} />
                <View style={styles.heroContent}>
                  <View>
                    <Text style={styles.heroGreeting}>Gift Vault 🎁</Text>
                    <Text style={styles.heroSub}>
                      Hey {firstName} · {totalGifts}{" "}
                      {totalGifts === 1 ? "gift" : "gifts"} collected
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setShowFilters(!showFilters)}
                    style={[
                      styles.filterBtn,
                      {
                        backgroundColor: showFilters
                          ? "rgba(255,255,255,0.25)"
                          : "rgba(255,255,255,0.15)",
                      },
                    ]}
                  >
                    <IconSymbol
                      name="slider.horizontal.3"
                      size={20}
                      color="#fff"
                    />
                  </Pressable>
                </View>

                {/* Stats */}
                {totalGifts > 0 && (
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statNum}>{totalGifts}</Text>
                      <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statNum}>{thisYearGifts}</Text>
                      <Text style={styles.statLabel}>This Year</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statNum}>{occasionCount}</Text>
                      <Text style={styles.statLabel}>Occasions</Text>
                    </View>
                  </View>
                )}
              </LinearGradient>

              {/* Search bar */}
              <View style={styles.searchContainer}>
                <View
                  style={[
                    styles.searchBar,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <IconSymbol
                    name="magnifyingglass"
                    size={16}
                    color={colors.muted}
                  />
                  <TextInput
                    ref={searchRef}
                    value={filters.search}
                    onChangeText={(v) => updateFilter("search", v)}
                    placeholder="Search gifts, tags..."
                    placeholderTextColor={colors.muted}
                    style={[styles.searchInput, { color: colors.foreground }]}
                    returnKeyType="search"
                  />
                  {filters.search.length > 0 && (
                    <Pressable
                      onPress={() => updateFilter("search", "")}
                      hitSlop={8}
                    >
                      <IconSymbol
                        name="xmark.circle.fill"
                        size={16}
                        color={colors.muted}
                      />
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Filter panel */}
              {showFilters && (
                <View
                  style={[
                    styles.filterPanel,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.filterSectionLabel, { color: colors.muted }]}
                  >
                    Occasion
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 14 }}
                  >
                    <Pressable
                      onPress={() => updateFilter("occasion", "all")}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor:
                            filters.occasion === "all"
                              ? colors.primary
                              : colors.surface2,
                          borderColor:
                            filters.occasion === "all"
                              ? colors.primary
                              : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          {
                            color:
                              filters.occasion === "all"
                                ? "#fff"
                                : colors.muted,
                          },
                        ]}
                      >
                        All
                      </Text>
                    </Pressable>
                    {OCCASIONS.map((occ) => (
                      <Pressable
                        key={occ.value}
                        onPress={() => updateFilter("occasion", occ.value)}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor:
                              filters.occasion === occ.value
                                ? colors.primary
                                : colors.surface2,
                            borderColor:
                              filters.occasion === occ.value
                                ? colors.primary
                                : colors.border,
                          },
                        ]}
                      >
                        <Text style={styles.filterChipEmoji}>{occ.emoji}</Text>
                        <Text
                          style={[
                            styles.filterChipText,
                            {
                              color:
                                filters.occasion === occ.value
                                  ? "#fff"
                                  : colors.muted,
                            },
                          ]}
                        >
                          {occ.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                  <Text
                    style={[styles.filterSectionLabel, { color: colors.muted }]}
                  >
                    Sort by
                  </Text>
                  <View style={styles.sortRow}>
                    {SORT_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt.key}
                        onPress={() => updateFilter("sortKey", opt.key)}
                        style={[
                          styles.sortChip,
                          {
                            backgroundColor:
                              filters.sortKey === opt.key
                                ? colors.primary
                                : colors.surface2,
                            borderColor:
                              filters.sortKey === opt.key
                                ? colors.primary
                                : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.sortChipText,
                            {
                              color:
                                filters.sortKey === opt.key
                                  ? "#fff"
                                  : colors.muted,
                            },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Section label */}
              {filteredGifts.length > 0 && (
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionLabel, { color: colors.muted }]}>
                    {filters.search || filters.occasion !== "all"
                      ? `${filteredGifts.length} results`
                      : "All Gifts"}
                  </Text>
                </View>
              )}
            </View>
          }
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={handleAddGift}
        style={({ pressed }) => [
          styles.fab,
          pressed && { transform: [{ scale: 0.92 }] },
        ]}
      >
        <LinearGradient
          colors={["#8B5CF6", "#EC4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <IconSymbol name="plus" size={26} color="#fff" />
        </LinearGradient>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -20,
    left: 40,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  heroGreeting: {
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
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  statItem: {
    flex: 1,
    alignItems: "center",
  },
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  filterPanel: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  filterSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 4,
  },
  filterChipEmoji: { fontSize: 13 },
  filterChipText: { fontSize: 12, fontWeight: "600" },
  sortRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  sortChipText: { fontSize: 12, fontWeight: "600" },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  row: {
    paddingHorizontal: 16,
    justifyContent: "space-between",
    marginBottom: 12,
  },
  grid: {
    paddingBottom: 120,
  },
  fab: {
    position: "absolute",
    bottom: 120,
    right: 30,
    borderRadius: 20,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  fabGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
  },
});
