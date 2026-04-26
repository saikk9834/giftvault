import React, { useState, useCallback, useRef, useMemo } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ScreenContainer } from '@/components/screen-container';
import { GiftCard } from '@/components/gift-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { EmptyState } from '@/components/ui/empty-state';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/hooks/use-auth';
import { trpc } from '@/lib/trpc';
import { GiftFilters, Occasion, OCCASIONS, GiftSortKey } from '@/lib/types';
import { applyFilters } from '@/lib/store/gift-store';

const SORT_OPTIONS: { key: GiftSortKey; label: string }[] = [
  { key: 'date_desc', label: 'Newest' },
  { key: 'date_asc', label: 'Oldest' },
  { key: 'name_asc', label: 'A → Z' },
  { key: 'name_desc', label: 'Z → A' },
];

const DEFAULT_FILTERS: GiftFilters = {
  search: '',
  occasion: 'all',
  tags: [],
  sortKey: 'date_desc',
};

export default function VaultScreen() {
  const colors = useColors();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [filters, setFilters] = useState<GiftFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef<TextInput>(null);

  // Fetch gifts from cloud DB
  const { data: rawGifts = [], isLoading, refetch } = trpc.gifts.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Normalize DB rows to match local Gift type (photos/tags are JSON strings in DB)
  const allGifts = useMemo(() =>
    rawGifts.map((g) => ({
      ...g,
      id: String(g.id),
      photos: (() => { try { return JSON.parse(g.photos ?? '[]') ?? []; } catch { return []; } })(),
      tags: (() => { try { return JSON.parse(g.tags ?? '[]') ?? []; } catch { return []; } })(),
      notes: g.notes ?? undefined,
    })),
    [rawGifts]
  );

  const filteredGifts = useMemo(() => applyFilters(allGifts as any, filters), [allGifts, filters]);

  const updateFilter = <K extends keyof GiftFilters>(key: K, value: GiftFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddGift = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/add-gift' as any);
  };

  if (authLoading) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </ScreenContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <EmptyState
          emoji="🔐"
          title="Sign in to access your vault"
          subtitle="Your gifts are stored securely in the cloud. Sign in to view them."
          actionLabel="Sign In"
          onAction={() => router.push('/login' as any)}
        />
      </ScreenContainer>
    );
  }

  const totalGifts = allGifts.length;
  const thisYearGifts = allGifts.filter(
    (g) => new Date(g.dateReceived).getFullYear() === new Date().getFullYear()
  ).length;

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Vault</Text>
          <Text style={[styles.headerSub, { color: colors.muted }]}>
            {isLoading ? 'Loading...' : `${totalGifts} gift${totalGifts !== 1 ? 's' : ''} collected`}
          </Text>
        </View>
        <Pressable
          onPress={() => setShowFilters(!showFilters)}
          style={({ pressed }) => [
            styles.filterBtn,
            {
              backgroundColor: showFilters ? colors.primary + '15' : colors.surface,
              borderColor: showFilters ? colors.primary + '40' : colors.border,
            },
            pressed && { opacity: 0.7 },
          ]}
        >
          <IconSymbol name="slider.horizontal.3" size={20} color={showFilters ? colors.primary : colors.muted} />
        </Pressable>
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
        <TextInput
          ref={searchRef}
          value={filters.search}
          onChangeText={(v) => updateFilter('search', v)}
          placeholder="Search gifts, tags..."
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { color: colors.foreground }]}
          returnKeyType="search"
        />
        {filters.search.length > 0 && (
          <Pressable onPress={() => updateFilter('search', '')} hitSlop={8}>
            <IconSymbol name="xmark.circle.fill" size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {/* Filter panel */}
      {showFilters && (
        <View style={[styles.filterPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.filterLabel, { color: colors.muted }]}>Occasion</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            <Pressable
              onPress={() => updateFilter('occasion', 'all')}
              style={[styles.filterChip, { backgroundColor: filters.occasion === 'all' ? colors.primary + '33' : colors.surface2, borderColor: filters.occasion === 'all' ? colors.primary : colors.border }]}
            >
              <Text style={[styles.filterChipText, { color: filters.occasion === 'all' ? colors.primary : colors.muted }]}>All</Text>
            </Pressable>
            {OCCASIONS.map((occ) => (
              <Pressable
                key={occ.value}
                onPress={() => updateFilter('occasion', occ.value)}
                style={[styles.filterChip, { backgroundColor: filters.occasion === occ.value ? colors.primary + '33' : colors.surface2, borderColor: filters.occasion === occ.value ? colors.primary : colors.border }]}
              >
                <Text style={styles.filterChipEmoji}>{occ.emoji}</Text>
                <Text style={[styles.filterChipText, { color: filters.occasion === occ.value ? colors.primary : colors.muted }]}>{occ.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={[styles.filterLabel, { color: colors.muted }]}>Sort by</Text>
          <View style={styles.sortRow}>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                onPress={() => updateFilter('sortKey', opt.key)}
                style={[styles.sortChip, { backgroundColor: filters.sortKey === opt.key ? colors.primary : colors.surface2, borderColor: filters.sortKey === opt.key ? colors.primary : colors.border }]}
              >
                <Text style={[styles.sortChipText, { color: filters.sortKey === opt.key ? '#fff' : colors.muted }]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Stats row */}
      {!showFilters && allGifts.length > 0 && (
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: colors.border }]}>
            <LinearGradient colors={['#8B5CF615', '#8B5CF605']} style={StyleSheet.absoluteFill} />
            <Text style={[styles.statNum, { color: colors.primary }]}>{totalGifts}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Total</Text>
          </View>
          <View style={[styles.statCard, { borderColor: colors.border }]}>
            <LinearGradient colors={['#EC489915', '#EC489905']} style={StyleSheet.absoluteFill} />
            <Text style={[styles.statNum, { color: colors.secondary }]}>{thisYearGifts}</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>This Year</Text>
          </View>
          <View style={[styles.statCard, { borderColor: colors.border }]}>
            <LinearGradient colors={['#F59E0B15', '#F59E0B05']} style={StyleSheet.absoluteFill} />
            <Text style={[styles.statNum, { color: colors.gold }]}>
              {new Set(allGifts.map((g) => g.occasion)).size}
            </Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Occasions</Text>
          </View>
        </View>
      )}

      {/* Loading state */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : filteredGifts.length === 0 ? (
        <EmptyState
          emoji="🎁"
          title={allGifts.length === 0 ? 'Your vault is empty' : 'No gifts found'}
          subtitle={allGifts.length === 0 ? 'Start logging the gifts you receive and build your memory vault.' : 'Try adjusting your search or filters.'}
          actionLabel={allGifts.length === 0 ? 'Add First Gift' : undefined}
          onAction={allGifts.length === 0 ? handleAddGift : undefined}
        />
      ) : (
        <FlatList
          data={filteredGifts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => <GiftCard gift={item as any} index={index} />}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={handleAddGift}
        style={({ pressed }) => [styles.fab, pressed && { transform: [{ scale: 0.93 }] }]}
      >
        <LinearGradient colors={['#C084FC', '#F472B6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fabGradient}>
          <IconSymbol name="plus" size={28} color="#fff" />
        </LinearGradient>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  headerTitle: { fontSize: 34, fontWeight: '800', letterSpacing: -0.8 },
  headerSub: { fontSize: 13, fontWeight: '500', marginTop: 3 },
  filterBtn: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 14, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, borderWidth: 1, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '400' },
  filterPanel: { marginHorizontal: 20, marginBottom: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  filterLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8, marginTop: 4 },
  filterRow: { marginBottom: 12 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginRight: 8, gap: 4 },
  filterChipEmoji: { fontSize: 13 },
  filterChipText: { fontSize: 12, fontWeight: '600' },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sortChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  sortChipText: { fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 10 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  statNum: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: '600', marginTop: 2, letterSpacing: 0.2 },
  row: { paddingHorizontal: 20, justifyContent: 'space-between' },
  grid: { paddingBottom: 100 },
  fab: { position: 'absolute', bottom: 24, right: 24, borderRadius: 28, shadowColor: '#C084FC', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  fabGradient: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
