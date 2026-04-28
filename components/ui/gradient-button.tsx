import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, Platform, View } from 'react-native';
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
  primary:   ['#8B5CF6', '#EC4899'] as const,
  secondary: ['#EC4899', '#8B5CF6'] as const,
  gold:      ['#F59E0B', '#FCD34D', '#F59E0B'] as const,
};

const SHADOW_COLORS = {
  primary: '#8B5CF6',
  secondary: '#EC4899',
  gold: '#F59E0B',
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
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const paddingV = size === 'sm' ? 11 : size === 'lg' ? 18 : 14;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 17 : 15;

  // Render Text + Spinner BOTH at all times, toggling visibility via opacity.
  // Conditional swaps inside an overflow:hidden clipping container fight
  // Fabric on Android (the ReactClippingViewManager mount race).
  return (
    <View
      style={[
        fullWidth && styles.fullWidth,
        !disabled && !loading && {
          shadowColor: SHADOW_COLORS[variant],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
          elevation: 6,
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        style={({ pressed }) => (pressed ? styles.pressed : null)}
      >
        <View
          style={[
            styles.pressable,
            fullWidth && styles.fullWidth,
            (disabled || loading) && styles.disabled,
          ]}
        >
          <LinearGradient
            colors={disabled ? ['#9CA3AF', '#6B7280'] : GRADIENTS[variant]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.gradient, { paddingVertical: paddingV }]}
          >
            <Text style={[styles.text, { fontSize, opacity: loading ? 0 : 1 }]}>
              {title}
            </Text>
            {/* Always mounted — only opacity toggles. Conditionally mounting
                this View inside an overflow:hidden parent is the exact
                trigger for the Fabric "addViewAt: child already has a parent"
                crash on Android. */}
            <View
              style={[styles.spinnerOverlay, { opacity: loading ? 1 : 0 }]}
              pointerEvents="none"
            >
              <ActivityIndicator color="#fff" size="small" />
            </View>
          </LinearGradient>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 16,
    // overflow:'hidden' removed — it makes this a ReactClippingView, which
    // is what Fabric crashes on. The LinearGradient inside has its own
    // borderRadius, so visual rounding is preserved without clipping here.
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.88,
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
    letterSpacing: 0.2,
  },
  spinnerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
