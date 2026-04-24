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
          backgroundColor: active ? colors.primary + '33' : colors.surface2,
          borderColor: active ? colors.primary : colors.border,
          paddingHorizontal: isSmall ? 8 : 12,
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
          },
        ]}
      >
        #{label}
      </Text>
      {onRemove && (
        <Pressable onPress={onRemove} style={styles.removeBtn} hitSlop={8}>
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
    fontWeight: '500',
  },
  removeBtn: {
    marginLeft: 4,
  },
  removeIcon: {
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '600',
  },
});
