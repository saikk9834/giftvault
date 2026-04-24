import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { format, formatDistanceToNow, isPast } from 'date-fns';

import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/hooks/use-auth';
import { trpc } from '@/lib/trpc';

function CountdownChip({ deliveryDate, isUnlocked }: { deliveryDate: string; isUnlocked: boolean }) {
  const colors = useColors();
  const delivery = new Date(deliveryDate);
  const available = isPast(delivery);

  if (isUnlocked) {
    return (
      <View style={[styles.chip, { backgroundColor: colors.success + '22', borderColor: colors.success + '44' }]}>
        <IconSymbol name="checkmark.circle.fill" size={12} color={colors.success} />
        <Text style={[styles.chipText, { color: colors.success }]}>Unlocked</Text>
      </View>
    );
  }

  if (available) {
    return (
      <View style={[styles.chip, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}>
        <IconSymbol name="gift.fill" size={12} color={colors.primary} />
        <Text style={[styles.chipText, { color: colors.primary }]}>Ready to Open</Text>
      </View>
    );
  }

  return (
    <View style={[styles.chip, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
      <IconSymbol name="clock.fill" size={12} color={colors.muted} />
      <Text style={[styles.chipText, { color: colors.muted }]}>
        {formatDistanceToNow(delivery, { addSuffix: true })}
      </Text>
    </View>
  );
}

type SurpriseCardItem = { id: string; senderId: number; senderName: string; senderAvatar?: string | null; recipientId: number; recipientName: string; giftContent: string; giftImage?: string | null; puzzle: string; answer: string; deliveryDate: string; isUnlocked: boolean; };

function SurpriseCard({ item }: { item: SurpriseCardItem }) {
  const colors = useColors();
  const delivery = new Date(item.deliveryDate);
  const available = isPast(delivery);

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({ pathname: '/surprise/[id]' as any, params: { id: item.id } });
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.surpriseCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
      ]}
    >
      {/* Gradient border accent for available surprises */}
      {available && !item.isUnlocked && (
        <LinearGradient
          colors={['#C084FC', '#F472B6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cardAccent}
        />
      )}

      <View style={styles.cardContent}>
        {/* Left: Avatar + info */}
        <View style={styles.cardLeft}>
          <Avatar name={item.senderName} size={48} />
          <View style={styles.cardInfo}>
            <Text style={[styles.cardSender, { color: colors.foreground }]} numberOfLines={1}>
              {item.senderName}
            </Text>
            <Text style={[styles.cardDate, { color: colors.muted }]}>
              {format(delivery, 'MMM d, yyyy')}
            </Text>
            <CountdownChip deliveryDate={item.deliveryDate} isUnlocked={item.isUnlocked} />
          </View>
        </View>

        {/* Right: Lock icon */}
        <View style={styles.cardRight}>
          {item.isUnlocked ? (
            <IconSymbol name="gift.fill" size={28} color={colors.primary} />
          ) : available ? (
            <View style={styles.glowIcon}>
              <LinearGradient
                colors={['#C084FC33', '#F472B633']}
                style={styles.glowBg}
              />
              <IconSymbol name="sparkles" size={28} color={colors.primary} />
            </View>
          ) : (
            <IconSymbol name="lock.fill" size={24} color={colors.muted} />
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function SurprisesScreen() {
  const colors = useColors();
  const { user, isAuthenticated } = useAuth();

  const { data: rawSurprises = [], refetch } = trpc.surprises.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useFocusEffect(useCallback(() => { if (isAuthenticated) refetch(); }, [isAuthenticated]));

  const incoming = useMemo(() =>
    rawSurprises.filter((s) => s.recipientId === user?.id).map((s) => ({
      ...s,
      id: String(s.id),
      deliveryDate: s.deliveryDate instanceof Date ? s.deliveryDate.toISOString() : String(s.deliveryDate),
    })),
    [rawSurprises, user]
  );
  const sent = useMemo(() =>
    rawSurprises.filter((s) => s.senderId === user?.id).map((s) => ({
      ...s,
      id: String(s.id),
      deliveryDate: s.deliveryDate instanceof Date ? s.deliveryDate.toISOString() : String(s.deliveryDate),
    })),
    [rawSurprises, user]
  );

  const handleSend = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/send-surprise' as any);
  };

  if (!isAuthenticated) {
    return (
      <ScreenContainer containerClassName="bg-background">
        <EmptyState
          emoji="🎁"
          title="Sign in to see surprises"
          subtitle="Send and receive interactive surprise gifts with friends."
          actionLabel="Sign In"
          onAction={() => router.push('/login' as any)}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Surprises</Text>
          <Text style={[styles.headerSub, { color: colors.muted }]}>
            {incoming.length} incoming · {sent.length} sent
          </Text>
        </View>
        <Pressable
          onPress={handleSend}
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
        >
          <LinearGradient
            colors={['#C084FC', '#F472B6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sendBtn}
          >
            <IconSymbol name="paperplane.fill" size={18} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>

      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <View>
            {/* Incoming */}
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>Incoming</Text>
            {incoming.length === 0 ? (
              <View style={[styles.emptySection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={[styles.emptyText, { color: colors.muted }]}>No incoming surprises yet</Text>
              </View>
            ) : (
              incoming.map((item) => <SurpriseCard key={item.id} item={item} />)
            )}

            {/* Sent */}
            <Text style={[styles.sectionTitle, { color: colors.muted, marginTop: 24 }]}>Sent</Text>
            {sent.length === 0 ? (
              <View style={[styles.emptySection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={styles.emptyEmoji}>📤</Text>
                <Text style={[styles.emptyText, { color: colors.muted }]}>You haven't sent any surprises</Text>
                <Pressable onPress={handleSend} style={{ marginTop: 8 }}>
                  <Text style={[styles.emptyAction, { color: colors.primary }]}>Send one now →</Text>
                </Pressable>
              </View>
            ) : (
              sent.map((item) => <SurpriseCard key={item.id} item={item} />)
            )}
          </View>
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    marginTop: 2,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  surpriseCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardAccent: {
    height: 2,
    width: '100%',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardSender: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardDate: {
    fontSize: 12,
  },
  cardRight: {
    marginLeft: 12,
  },
  glowIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    overflow: 'hidden',
  },
  glowBg: {
    ...StyleSheet.absoluteFillObject,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptySection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyAction: {
    fontSize: 14,
    fontWeight: '700',
  },
});
