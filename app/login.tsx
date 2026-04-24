import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { startOAuthLogin } from '@/constants/oauth';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setLoading(true);
    try {
      await startOAuthLogin();
      // On native, the OAuth callback will redirect back via deep link
      // On web, the page will redirect
    } catch (e) {
      console.error('[Login] Failed to start OAuth:', e);
    } finally {
      // Keep loading on native (waiting for deep link callback)
      if (Platform.OS === 'web') {
        setLoading(false);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#0D0D0F', '#1A1A2E', '#0D0D0F']}
        style={StyleSheet.absoluteFill}
      />
      {/* Glow orbs */}
      <View style={[styles.orb1, { backgroundColor: '#C084FC' }]} />
      <View style={[styles.orb2, { backgroundColor: '#F472B6' }]} />

      <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
        {/* Logo area */}
        <View style={styles.logoArea}>
          <LinearGradient
            colors={['#C084FC', '#F472B6', '#F59E0B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <Text style={styles.logoEmoji}>🎁</Text>
          </LinearGradient>
          <Text style={[styles.appName, { color: colors.foreground }]}>GiftVault</Text>
          <Text style={[styles.tagline, { color: colors.muted }]}>
            Your personal gift memory & surprise sharing app
          </Text>
        </View>

        {/* Feature highlights */}
        <View style={styles.features}>
          {[
            { icon: 'gift.fill', text: 'Track every gift you receive' },
            { icon: 'sparkles', text: 'Send interactive surprise gifts' },
            { icon: 'lock.fill', text: 'Puzzle-locked reveals with confetti' },
            { icon: 'person.2.fill', text: 'Connect with friends' },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primary + '22' }]}>
                <IconSymbol name={f.icon as any} size={16} color={colors.primary} />
              </View>
              <Text style={[styles.featureText, { color: colors.muted }]}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.cta}>
          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={({ pressed }) => [
              styles.loginBtn,
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
          >
            <LinearGradient
              colors={['#C084FC', '#F472B6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <IconSymbol name="person.fill" size={18} color="#fff" />
                  <Text style={styles.loginBtnText}>Sign in to GiftVault</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
          <Text style={[styles.disclaimer, { color: colors.muted }]}>
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  orb1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    top: -80,
    right: -80,
    opacity: 0.08,
  },
  orb2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    bottom: 100,
    left: -80,
    opacity: 0.06,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
  },
  logoArea: {
    alignItems: 'center',
    gap: 12,
  },
  logoGradient: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C084FC',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  logoEmoji: {
    fontSize: 48,
  },
  appName: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
    marginTop: 4,
  },
  tagline: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 260,
  },
  features: {
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  cta: {
    gap: 14,
  },
  loginBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  loginBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
