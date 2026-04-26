import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';

import { Gift } from '@/lib/types';
import { OccasionBadge } from '@/components/ui/occasion-badge';
import { useColors } from '@/hooks/use-colors';

const CARD_WIDTH = (Dimensions.get('window').width - 52) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.35;

const PLACEHOLDER_GRADIENTS: Record<string, readonly [string, string]> = {
  birthday:    ['#EC4899', '#F472B6'],
  anniversary: ['#8B5CF6', '#A78BFA'],
  christmas:   ['#EF4444', '#F97316'],
  wedding:     ['#F59E0B', '#FCD34D'],
  graduation:  ['#3B82F6', '#60A5FA'],
  valentines:  ['#F43F5E', '#FB7185'],
  mothers_day: ['#EC4899', '#F9A8D4'],
  fathers_day: ['#6366F1', '#818CF8'],
  hanukkah:   ['#3B82F6', '#93C5FD'],
  other:       ['#8B5CF6', '#EC4899'],
};

interface GiftCardProps {
  gift: Gift;
  index?: number;
}

export function GiftCard({ gift }: GiftCardProps) {
  const colors = useColors();
  const hasPhoto = gift.photos.length > 0;
  const [c1, c2] = PLACEHOLDER_GRADIENTS[gift.occasion] ?? PLACEHOLDER_GRADIENTS.other;

  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: '/gift/[id]' as any, params: { id: gift.id } });
  };

  const formattedDate = (() => {
    try { return format(new Date(gift.dateReceived), 'MMM d, yyyy'); }
    catch { return gift.dateReceived; }
  })();

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.cardShadow,
        { width: CARD_WIDTH },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.card, { height: CARD_HEIGHT }]}>
      {/* Full-bleed photo or gradient */}
      {hasPhoto ? (
        <Image source={{ uri: gift.photos[0] }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      ) : (
        <LinearGradient colors={[c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill}>
          <View style={styles.placeholderInner}>
            <Text style={styles.placeholderEmoji}>🎁</Text>
          </View>
        </LinearGradient>
      )}

      {/* Dark gradient overlay at bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.72)']}
        locations={[0, 0.45, 1]}
        style={styles.overlay}
      />

      {/* Badge top-right */}
      <View style={styles.badge}>
        <OccasionBadge occasion={gift.occasion} size="sm" />
      </View>

      {/* Info at bottom */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{gift.title}</Text>
        <Text style={styles.date}>{formattedDate}</Text>
        {gift.tags.length > 0 && (
          <Text style={styles.tags} numberOfLines={1}>
            #{gift.tags.slice(0, 2).join(' #')}
          </Text>
        )}
      </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Outer: owns the shadow. Must NOT have overflow:hidden — Android can't
  // composite elevation shadows and clip masks on the same layer.
  cardShadow: {
    borderRadius: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  // Inner: owns the clip. No elevation here.
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  pressed: {
    transform: [{ scale: 0.955 }],
    opacity: 0.92,
  },
  placeholderInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 44,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 18,
    letterSpacing: -0.1,
  },
  date: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '500',
  },
  tags: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    marginTop: 1,
  },
});
