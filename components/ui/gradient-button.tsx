import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const GRADIENTS = {
  primary: ['#C084FC', '#F472B6'] as const,
  secondary: ['#F472B6', '#C084FC'] as const,
  gold: ['#F59E0B', '#FCD34D', '#F59E0B'] as const,
};

export function GradientButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = true,
}: GradientButtonProps) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const paddingV = size === 'sm' ? 10 : size === 'lg' ? 18 : 14;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 18 : 15;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.pressable,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={disabled ? ['#4B4B6B', '#3A3A5C'] : GRADIENTS[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, { paddingVertical: paddingV }]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={[styles.text, { fontSize }]}>{title}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
