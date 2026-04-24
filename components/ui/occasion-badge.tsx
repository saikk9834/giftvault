import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Occasion, OCCASIONS } from '@/lib/types';
import { useColors } from '@/hooks/use-colors';

interface OccasionBadgeProps {
  occasion: Occasion;
  size?: 'sm' | 'md';
}

export function OccasionBadge({ occasion, size = 'sm' }: OccasionBadgeProps) {
  const colors = useColors();
  const info = OCCASIONS.find((o) => o.value === occasion) ?? OCCASIONS[OCCASIONS.length - 1];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.primary + '22',
          borderColor: colors.primary + '44',
          paddingHorizontal: isSmall ? 6 : 10,
          paddingVertical: isSmall ? 2 : 4,
        },
      ]}
    >
      <Text style={[styles.emoji, { fontSize: isSmall ? 10 : 13 }]}>{info.emoji}</Text>
      <Text
        style={[
          styles.label,
          {
            color: colors.primary,
            fontSize: isSmall ? 10 : 12,
          },
        ]}
      >
        {info.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    gap: 3,
  },
  emoji: {
    lineHeight: 16,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
