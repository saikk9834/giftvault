import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { Gift } from '@/lib/types';
import { OccasionBadge } from '@/components/ui/occasion-badge';
import { useColors } from '@/hooks/use-colors';
import { format } from 'date-fns';

const CARD_WIDTH = (Dimensions.get('window').width - 48) / 2;

interface GiftCardProps {
  gift: Gift;
  index?: number;
}

export function GiftCard({ gift, index = 0 }: GiftCardProps) {
  const colors = useColors();
  const hasPhoto = gift.photos.length > 0;

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({ pathname: '/gift/[id]' as any, params: { id: gift.id } });
  };

  const formattedDate = (() => {
    try {
      return format(new Date(gift.dateReceived), 'MMM d, yyyy');
    } catch {
      return gift.dateReceived;
    }
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
        },
        pressed && styles.pressed,
      ]}
    >
      {/* Image area */}
      <View style={styles.imageContainer}>
        {hasPhoto ? (
          <Image
            source={{ uri: gift.photos[0] }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <LinearGradient
            colors={['#1A1A2E', '#16213E']}
            style={styles.imagePlaceholder}
          >
            <Text style={styles.placeholderEmoji}>🎁</Text>
          </LinearGradient>
        )}
        {/* Gradient overlay at bottom of image */}
        <LinearGradient
          colors={['transparent', 'rgba(13,13,15,0.7)']}
          style={styles.imageGradient}
        />
        {/* Occasion badge overlay */}
        <View style={styles.badgeOverlay}>
          <OccasionBadge occasion={gift.occasion} size="sm" />
        </View>
      </View>

      {/* Info area */}
      <View style={styles.info}>
        <Text
          style={[styles.title, { color: colors.foreground }]}
          numberOfLines={2}
        >
          {gift.title}
        </Text>
        <Text style={[styles.date, { color: colors.muted }]}>{formattedDate}</Text>
        {gift.tags.length > 0 && (
          <Text style={[styles.tags, { color: colors.primary }]} numberOfLines={1}>
            #{gift.tags.slice(0, 2).join(' #')}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  imageContainer: {
    height: 140,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
  },
  badgeOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  info: {
    padding: 10,
    gap: 3,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  date: {
    fontSize: 11,
    fontWeight: '400',
  },
  tags: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
