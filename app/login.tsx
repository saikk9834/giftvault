import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Api from '@/lib/_core/api';
import * as Auth from '@/lib/_core/auth';

type Mode = 'signin' | 'signup';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === 'signup';

  const handleSubmit = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required');
      return;
    }
    if (isSignUp && !name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    try {
      const result = isSignUp
        ? await Api.signup(name.trim(), email.trim().toLowerCase(), password)
        : await Api.signin(email.trim().toLowerCase(), password);

      if (result.sessionToken) {
        await Auth.setSessionToken(result.sessionToken);
      }

      const userInfo: Auth.User = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        loginMethod: result.user.loginMethod,
        lastSignedIn: new Date(result.user.lastSignedIn),
      };
      await Auth.setUserInfo(userInfo);

      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setError(null);
    setMode(m => (m === 'signin' ? 'signup' : 'signin'));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={['#0D0D0F', '#1A1A2E', '#0D0D0F']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.orb1, { backgroundColor: '#C084FC' }]} />
        <View style={[styles.orb2, { backgroundColor: '#F472B6' }]} />

        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
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
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {isSignUp && (
              <View style={styles.inputWrapper}>
                <IconSymbol name="person.fill" size={16} color={colors.muted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                  placeholder="Your name"
                  placeholderTextColor={colors.muted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            )}

            <View style={styles.inputWrapper}>
              <IconSymbol name="envelope.fill" size={16} color={colors.muted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                placeholder="Email address"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputWrapper}>
              <IconSymbol name="lock.fill" size={16} color={colors.muted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
                placeholder="Password"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
            </View>

            {error && (
              <View style={[styles.errorBox, { backgroundColor: '#FF444422', borderColor: '#FF4444' }]}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
              ]}
            >
              <LinearGradient
                colors={['#C084FC', '#F472B6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitBtnGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable onPress={toggleMode} style={styles.toggleBtn}>
              <Text style={[styles.toggleText, { color: colors.muted }]}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <Text style={{ color: colors.primary, fontWeight: '700' }}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  scroll: {
    paddingHorizontal: 32,
    flexGrow: 1,
    justifyContent: 'center',
    gap: 40,
  },
  logoArea: {
    alignItems: 'center',
    gap: 12,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C084FC',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  logoEmoji: {
    fontSize: 40,
  },
  appName: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 15,
    textAlign: 'center',
  },
  form: {
    gap: 14,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingLeft: 44,
    paddingRight: 16,
    fontSize: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  errorText: {
    color: '#FF6666',
    fontSize: 14,
    textAlign: 'center',
  },
  submitBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 4,
  },
  submitBtnGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  toggleBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
