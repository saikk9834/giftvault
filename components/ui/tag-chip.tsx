import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/use-colors';

interface TagChipProps {
  label: string;
  onRemove?: () => void;
  active?: boolean;
  onPress?: () => void;
  size?: 'sm' | 'md';
}

export function TagChip({ label, onRemove, active = false, onPress, size = 'md' }: TagChipProps) {
  const colors = useColors();
  const isSmall = size === 'sm';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.primary + '18' : colors.surface2,
          borderColor: active ? colors.primary + '60' : colors.border,
          paddingHorizontal: isSmall ? 9 : 12,
          paddingVertical: isSmall ? 4 : 6,
        },
        pressed && onPress && { opacity: 0.7 },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: active ? colors.primary : colors.muted,
            fontSize: isSmall ? 11 : 13,
            fontWeight: active ? '700' : '600',
          },
        ]}
      >
        #{label}
      </Text>
      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={10} style={styles.removeBtn}>
          <Text style={[styles.removeIcon, { color: colors.muted }]}>×</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 6,
    marginBottom: 6,
  },
  label: {
    letterSpacing: 0.1,
  },
  removeBtn: {
    marginLeft: 5,
  },
  removeIcon: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '700',
  },
});
