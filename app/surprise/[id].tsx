import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Animated,
  Easing,
  Platform,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Modal,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { format, isPast, isToday } from 'date-fns';

import { Image } from 'expo-image';
import { useColors } from '@/hooks/use-colors';
import { trpc } from '@/lib/trpc';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { GradientButton } from '@/components/ui/gradient-button';
import { Avatar } from '@/components/ui/avatar';

const { width: W, height: H } = Dimensions.get('window');

// ─── Confetti Particle ────────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#C084FC', '#F472B6', '#F59E0B', '#60A5FA', '#4ADE80', '#FB923C'];

function ConfettiParticle({ delay, x }: { delay: number; x: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const rotAnim = useRef(new Animated.Value(0)).current;
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
  const size = 6 + Math.random() * 8;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(anim, {
        toValue: 1,
        duration: 1200 + Math.random() * 600,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(rotAnim, {
        toValue: 1,
        duration: 1000 + Math.random() * 500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-20, H * 0.8] });
  const translateX = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [x, x + (Math.random() - 0.5) * 80, x + (Math.random() - 0.5) * 120],
  });
  const opacity = anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });
  const rotate = rotAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${360 + Math.random() * 360}deg`] });

  return (
    <Animated.View
      style={[
        styles.confettiParticle,
        {
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: Math.random() > 0.5 ? size / 2 : 2,
          transform: [{ translateX }, { translateY }, { rotate }],
          opacity,
        },
      ]}
    />
  );
}

function ConfettiExplosion({ active }: { active: boolean }) {
  if (!active) return null;
  const particles = Array.from({ length: 50 }, (_, i) => ({
    key: i,
    delay: Math.random() * 400,
    x: Math.random() * W,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <ConfettiParticle key={p.key} delay={p.delay} x={p.x} />
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SurpriseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [answer, setAnswer] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [wrongAnim] = useState(new Animated.Value(0));
  const [revealAnim] = useState(new Animated.Value(0));
  const [blurIntensity, setBlurIntensity] = useState(80);
  const [showConfetti, setShowConfetti] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);

  const numericId = id ? parseInt(id, 10) : 0;
  const utils = trpc.useUtils();
  const { data: surprise, isLoading } = trpc.surprises.getById.useQuery(
    { id: numericId },
    { enabled: !!id && !isNaN(numericId) }
  );

  useEffect(() => {
    if (surprise?.isUnlocked) {
      setBlurIntensity(0);
      revealAnim.setValue(1);
    }
  }, [surprise?.isUnlocked]);
  const unlockMutation = trpc.surprises.unlock.useMutation({
    onSuccess: () => utils.surprises.list.invalidate(),
  });

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(wrongAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(wrongAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(wrongAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(wrongAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(wrongAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const triggerReveal = () => {
    // Animate blur away
    let intensity = 80;
    const interval = setInterval(() => {
      intensity -= 8;
      if (intensity <= 0) {
        clearInterval(interval);
        setBlurIntensity(0);
      } else {
        setBlurIntensity(intensity);
      }
    }, 40);

    // Scale in reveal
    Animated.spring(revealAnim, {
      toValue: 1,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Confetti
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2500);
  };

  const handleSubmit = async () => {
    if (!surprise || !answer.trim()) return;

    try {
      const result = await unlockMutation.mutateAsync({ id: numericId, answer });
      if (result.correct || result.alreadyUnlocked) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setJustUnlocked(true);
        triggerReveal();
        utils.surprises.getById.invalidate({ id: numericId });
      } else {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setAttempts((a) => a + 1);
        shakeAnimation();
        setAnswer('');
      }
    } catch {
      setAttempts((a) => a + 1);
      shakeAnimation();
      setAnswer('');
    }
  };

  if (isLoading || !surprise) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={[{ color: colors.muted, fontSize: 16 }]}>{isLoading ? 'Loading...' : 'Surprise not found'}</Text>
      </View>
    );
  }

  const delivery = new Date(surprise.deliveryDate);
  const available = isPast(delivery) || isToday(delivery);
  const isUnlocked = surprise.isUnlocked;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <Pressable
              onPress={() => router.back()}
              style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.topTitle, { color: colors.foreground }]}>Surprise Gift</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Sender info */}
          <View style={styles.senderRow}>
            <Avatar name={surprise.senderName} size={52} />
            <View style={styles.senderInfo}>
              <Text style={[styles.senderLabel, { color: colors.muted }]}>From</Text>
              <Text style={[styles.senderName, { color: colors.foreground }]}>{surprise.senderName}</Text>
              <Text style={[styles.senderDate, { color: colors.muted }]}>
                {format(delivery, 'MMMM d, yyyy')}
              </Text>
            </View>
          </View>

          {/* Gift content area */}
          <View style={styles.giftArea}>
            {/* Background gradient */}
            <LinearGradient
              colors={['#1A1A2E', '#16213E']}
              style={styles.giftBg}
            />

            {/* Gift content (revealed or blurred) */}
            <Animated.View
              style={[
                styles.giftContent,
                {
                  transform: [
                    {
                      scale: revealAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.85, 1],
                      }),
                    },
                  ],
                  opacity: revealAnim,
                },
              ]}
            >
              <Text style={styles.giftEmoji}>🎁</Text>
              <Text style={[styles.giftText, { color: colors.foreground }]}>
                {surprise.giftContent}
              </Text>
            </Animated.View>

            {/* Blur overlay (only when locked) */}
            {!isUnlocked && blurIntensity > 0 && (
              <BlurView
                intensity={blurIntensity}
                tint="dark"
                experimentalBlurMethod="dimezisBlurView"
                style={[StyleSheet.absoluteFill, styles.blurOverlay]}
              >
                <View style={styles.lockOverlay}>
                  <LinearGradient
                    colors={['#C084FC33', '#F472B633']}
                    style={styles.lockIconBg}
                  >
                    <IconSymbol name="lock.fill" size={36} color="#C084FC" />
                  </LinearGradient>
                  <Text style={styles.lockText}>
                    {available ? 'Solve the puzzle to unlock' : 'Not yet available'}
                  </Text>
                </View>
              </BlurView>
            )}
          </View>

          {/* Puzzle section */}
          {!isUnlocked && available && (
            <View style={[styles.puzzleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <LinearGradient
                colors={['#C084FC', '#F472B6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.puzzleAccent}
              />
              <View style={styles.puzzleContent}>
                <View style={styles.puzzleHeader}>
                  <IconSymbol name="sparkles" size={18} color={colors.primary} />
                  <Text style={[styles.puzzleTitle, { color: colors.primary }]}>Solve the Riddle</Text>
                </View>
                <Text style={[styles.puzzleText, { color: colors.foreground }]}>
                  {surprise.puzzle}
                </Text>

                {surprise.puzzleImage && (
                  <Pressable onPress={() => setLightboxUri(surprise.puzzleImage!)}>
                    <Image
                      source={{ uri: surprise.puzzleImage }}
                      style={styles.puzzleImage}
                      contentFit="cover"
                    />
                  </Pressable>
                )}

                {attempts > 0 && (
                  <View style={[styles.hintBox, { backgroundColor: colors.warning + '22', borderColor: colors.warning + '44' }]}>
                    <Text style={[styles.hintText, { color: colors.warning }]}>
                      {attempts === 1
                        ? 'Not quite! Think carefully...'
                        : attempts === 2
                        ? 'Keep trying! You\'re getting closer.'
                        : 'Hint: Think simply — the answer is one word.'}
                    </Text>
                  </View>
                )}

                <Animated.View style={{ transform: [{ translateX: wrongAnim }] }}>
                  <TextInput
                    value={answer}
                    onChangeText={setAnswer}
                    placeholder="Your answer..."
                    placeholderTextColor={colors.muted}
                    style={[
                      styles.answerInput,
                      {
                        backgroundColor: colors.surface2,
                        borderColor: attempts > 0 ? colors.error + '66' : colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    autoCapitalize="none"
                  />
                </Animated.View>

                <GradientButton
                  title="Unlock Gift 🔓"
                  onPress={handleSubmit}
                  disabled={!answer.trim()}
                  size="lg"
                />
              </View>
            </View>
          )}

          {/* Unlocked state */}
          {isUnlocked && (
            <View style={[styles.unlockedCard, { backgroundColor: colors.success + '11', borderColor: colors.success + '33' }]}>
              <IconSymbol name="checkmark.circle.fill" size={32} color={colors.success} />
              <Text style={[styles.unlockedTitle, { color: colors.success }]}>
                {justUnlocked ? '🎉 You unlocked it!' : 'Gift Unlocked'}
              </Text>
              <Text style={[styles.unlockedSub, { color: colors.muted }]}>
                {justUnlocked
                  ? 'Congratulations! Enjoy your surprise.'
                  : `Unlocked on ${surprise.unlockedAt ? format(new Date(surprise.unlockedAt), 'MMM d, yyyy') : 'recently'}`}
              </Text>
              {surprise.giftImage && (
                <>
                  <Text style={[styles.imageLabel, { color: colors.muted }]}>Gift</Text>
                  <Pressable onPress={() => setLightboxUri(surprise.giftImage!)} style={styles.giftImageWrapper}>
                    <Image
                      source={{ uri: surprise.giftImage }}
                      style={styles.giftImage}
                      contentFit="cover"
                    />
                  </Pressable>
                </>
              )}
              {surprise.puzzleImage && (
                <>
                  <Text style={[styles.imageLabel, { color: colors.muted }]}>The Riddle</Text>
                  <Pressable onPress={() => setLightboxUri(surprise.puzzleImage!)} style={styles.giftImageWrapper}>
                    <Image
                      source={{ uri: surprise.puzzleImage }}
                      style={styles.giftImage}
                      contentFit="cover"
                    />
                  </Pressable>
                </>
              )}
            </View>
          )}

          {/* Countdown for future gifts */}
          {!available && !isUnlocked && (
            <View style={[styles.countdownCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <IconSymbol name="clock.fill" size={24} color={colors.muted} />
              <Text style={[styles.countdownTitle, { color: colors.foreground }]}>
                Available {format(delivery, 'MMMM d, yyyy')}
              </Text>
              <Text style={[styles.countdownSub, { color: colors.muted }]}>
                Come back then to solve the puzzle and unlock your surprise.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Lightbox */}
      <Modal
        visible={!!lightboxUri}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setLightboxUri(null)}
      >
        <StatusBar hidden />
        <View style={styles.lightboxBg}>
          <Image
            source={{ uri: lightboxUri ?? '' }}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
          />
          <Pressable
            onPress={() => setLightboxUri(null)}
            style={[styles.lightboxClose, { top: insets.top + 12 }]}
          >
            <View style={styles.lightboxCloseBtn}>
              <IconSymbol name="xmark" size={18} color="#fff" />
            </View>
          </Pressable>
        </View>
      </Modal>

      {/* Confetti overlay */}
      <ConfettiExplosion active={showConfetti} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  senderInfo: { flex: 1 },
  senderLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  senderName: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  senderDate: { fontSize: 13, marginTop: 2 },
  giftArea: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftBg: {
    ...StyleSheet.absoluteFillObject,
  },
  giftContent: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  giftEmoji: {
    fontSize: 56,
  },
  giftText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
  },
  blurOverlay: {
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockOverlay: {
    alignItems: 'center',
    gap: 12,
  },
  lockIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  puzzleCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  puzzleAccent: {
    height: 3,
  },
  puzzleContent: {
    padding: 18,
    gap: 14,
  },
  puzzleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  puzzleTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  puzzleText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  puzzleImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
  },
  hintBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  hintText: {
    fontSize: 13,
    fontWeight: '500',
  },
  answerInput: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
  },
  unlockedCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  unlockedTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  unlockedSub: {
    fontSize: 14,
    textAlign: 'center',
  },
  countdownCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  countdownTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  countdownSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  confettiParticle: {
    position: 'absolute',
    top: 0,
  },
  imageLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  giftImageWrapper: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  giftImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  lightboxBg: {
    flex: 1,
    backgroundColor: '#000',
  },
  lightboxClose: {
    position: 'absolute',
    right: 16,
  },
  lightboxCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
