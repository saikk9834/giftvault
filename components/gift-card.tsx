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
import { useColorScheme } from '@/hooks/use-color-scheme';

const CARD_WIDTH = (Dimensions.get('window').width - 52) / 2;

const PLACEHOLDER_GRADIENTS: Record<string, [string, string]> = {
  birthday:   ['#EC4899', '#F472B6'],
  anniversary:['#8B5CF6', '#C084FC'],
  christmas:  ['#EF4444', '#F97316'],
  wedding:    ['#F59E0B', '#FCD34D'],
  graduation: ['#3B82F6', '#60A5FA'],
  valentines: ['#F43F5E', '#FB7185'],
  mothers_day:['#EC4899', '#F9A8D4'],
  fathers_day:['#6366F1', '#818CF8'],
  hanukkah:   ['#3B82F6', '#93C5FD'],
  other:      ['#8B5CF6', '#F472B6'],
};

interface GiftCardProps {
  gift: Gift;
  index?: number;
}

export function GiftCard({ gift, index = 0 }: GiftCardProps) {
  const colors = useColors();
  const scheme = useColorScheme() ?? 'dark';
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
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          width: CARD_WIDTH,
          ...(scheme === 'light' && {
            shadowColor: '#6D28D9',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
          }),
        },
        pressed && styles.pressed,
      ]}
    >
      {/* Image area */}
      <View style={styles.imageContainer}>
        {hasPhoto ? (
          <Image source={{ uri: gift.photos[0] }} style={styles.image} contentFit="cover" transition={200} />
        ) : (
          <LinearGradient colors={[c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.image}>
            <Text style={styles.placeholderEmoji}>🎁</Text>
          </LinearGradient>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.45)']}
          style={styles.imageGradient}
        />
        <View style={styles.badgeOverlay}>
          <OccasionBadge occasion={gift.occasion} size="sm" />
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {gift.title}
        </Text>
        <Text style={[styles.date, { color: colors.muted }]}>{formattedDate}</Text>
        {gift.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {gift.tags.slice(0, 2).map((tag) => (
              <View key={tag} style={[styles.tagPill, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.92,
  },
  imageContainer: {
    height: 155,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 38,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  badgeOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  info: {
    padding: 12,
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    letterSpacing: -0.1,
  },
  date: {
    fontSize: 11,
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  tagPill: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
