import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { GradientButton } from './gradient-button';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji = '🎁', title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text>
      )}
      {actionLabel && onAction && (
        <View style={styles.action}>
          <GradientButton title={actionLabel} onPress={onAction} fullWidth={false} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  action: {
    marginTop: 8,
  },
});
