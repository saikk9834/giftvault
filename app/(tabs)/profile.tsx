import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/ui/avatar';
import { GradientButton } from '@/components/ui/gradient-button';
import { useColors } from '@/hooks/use-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';
import { trpc } from '@/lib/trpc';

interface StatCardProps {
  value: number | string;
  label: string;
  color: string;
}

function StatCard({ value, label, color }: StatCardProps) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

function SettingsRow({ icon, label, value, onPress, rightElement }: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsRow,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && onPress && { opacity: 0.7 },
      ]}
    >
      <View style={[styles.settingsIcon, { backgroundColor: colors.primary + '22' }]}>
        <IconSymbol name={icon as any} size={18} color={colors.primary} />
      </View>
      <Text style={[styles.settingsLabel, { color: colors.foreground }]}>{label}</Text>
      <View style={styles.settingsRight}>
        {value && <Text style={[styles.settingsValue, { color: colors.muted }]}>{value}</Text>}
        {rightElement}
        {onPress && !rightElement && (
          <IconSymbol name="chevron.right" size={16} color={colors.muted} />
        )}
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const { user, isAuthenticated } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name ?? '');

  const { data: gifts = [] } = trpc.gifts.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: surprises = [] } = trpc.surprises.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: friendsList = [] } = trpc.friends.list.useQuery(undefined, { enabled: isAuthenticated });
  const logoutMutation = trpc.auth.logout.useMutation();

  const stats = {
    gifts: gifts.length,
    surprisesSent: surprises.filter((s) => s.senderId === user?.id).length,
    surprisesReceived: surprises.filter((s) => s.recipientId === user?.id).length,
    friends: friendsList.filter((f) => f.status === 'accepted').length,
  };

  const displayName = user?.name ?? 'GiftVault User';
  const username = user?.email?.split('@')[0] ?? 'user';

  const handleSaveName = async () => {
    // Name update would require a server endpoint; for now just close edit mode
    setEditingName(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await logoutMutation.mutateAsync();
      }},
    ]);
  };

  if (!isAuthenticated) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '700', marginBottom: 8 }}>Sign in to GiftVault</Text>
          <Text style={{ color: colors.muted, textAlign: 'center', marginBottom: 24 }}>Create an account to sync your gifts and send surprises to friends.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Profile hero */}
        <LinearGradient
          colors={['#1A1A2E', '#16213E']}
          style={styles.hero}
        >
          <LinearGradient
            colors={['#C084FC22', '#F472B622']}
            style={StyleSheet.absoluteFill}
          />
          <Avatar name={displayName} size={80} />
          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                style={[styles.nameInput, { color: colors.foreground, borderColor: colors.primary }]}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
              />
              <Pressable onPress={handleSaveName} style={[styles.saveNameBtn, { backgroundColor: colors.primary }]}>
                <IconSymbol name="checkmark" size={16} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={() => setEditingName(true)} style={styles.nameRow}>
              <Text style={[styles.displayName, { color: colors.foreground }]}>{displayName}</Text>
              <IconSymbol name="pencil" size={14} color={colors.muted} />
            </Pressable>
          )}
          <Text style={[styles.username, { color: colors.muted }]}>@{username}</Text>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <StatCard value={stats.gifts} label="Gifts" color={colors.primary} />
          <StatCard value={stats.surprisesReceived} label="Received" color={colors.secondary} />
          <StatCard value={stats.surprisesSent} label="Sent" color={colors.gold} />
          <StatCard value={stats.friends} label="Friends" color={colors.success} />
        </View>

        {/* Settings */}
        <Text style={[styles.sectionTitle, { color: colors.muted }]}>Preferences</Text>
        <View style={styles.settingsGroup}>
          <SettingsRow
            icon="bell.fill"
            label="Notifications"
            rightElement={
              <Switch
                value={true}
                onValueChange={() => {}}
                trackColor={{ true: colors.primary, false: colors.border }}
                thumbColor="#fff"
              />
            }
          />
          <SettingsRow
            icon="gear"
            label="Dark Mode"
            value={colorScheme === 'dark' ? 'On' : 'Off'}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.muted }]}>About</Text>
        <View style={styles.settingsGroup}>
          <SettingsRow icon="info.circle" label="Version" value="1.0.0" />
          <SettingsRow
            icon="star.fill"
            label="Rate GiftVault"
            onPress={() => Alert.alert('Thank you!', 'Your feedback means the world to us. 💜')}
          />
          <SettingsRow
            icon="square.and.arrow.up"
            label="Share App"
            onPress={() => Alert.alert('Share', 'giftvault.app — Share the love!')}
          />
        </View>

        {/* Sign Out */}
        <View style={styles.signOutSection}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.signOutBtn,
              { borderColor: colors.error + '55', backgroundColor: colors.error + '11' },
              pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
            ]}
          >
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={18} color={colors.error} />
            <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
          </Pressable>
          <Text style={[styles.signOutHint, { color: colors.muted }]}>
            Signed in as {user?.email ?? user?.name ?? 'you'}
          </Text>
        </View>

        {/* Firebase schema note */}
        <View style={[styles.schemaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <LinearGradient
            colors={['#C084FC', '#F472B6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.schemaAccent}
          />
          <View style={styles.schemaContent}>
            <Text style={[styles.schemaTitle, { color: colors.foreground }]}>🔥 Firebase Ready</Text>
            <Text style={[styles.schemaSub, { color: colors.muted }]}>
              GiftVault is architected for Firebase. Connect Auth, Firestore, Storage, and Cloud Messaging to enable cross-device sync, real-time surprises, and push notifications.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 100 },
  hero: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 8,
    overflow: 'hidden',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  displayName: { fontSize: 24, fontWeight: '800' },
  username: { fontSize: 14, fontWeight: '500' },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  nameInput: {
    borderBottomWidth: 2,
    fontSize: 22,
    fontWeight: '700',
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 160,
    textAlign: 'center',
  },
  saveNameBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600', marginTop: 2, letterSpacing: 0.3 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 8,
  },
  settingsGroup: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    gap: 1,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  settingsIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  settingsRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingsValue: { fontSize: 14 },
  schemaCard: {
    marginHorizontal: 20,
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  schemaAccent: { height: 3 },
  schemaContent: { padding: 16, gap: 6 },
  schemaTitle: { fontSize: 15, fontWeight: '700' },
  schemaSub: { fontSize: 13, lineHeight: 20 },
  signOutSection: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
    gap: 10,
    alignItems: 'center',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  signOutText: { fontSize: 16, fontWeight: '700' },
  signOutHint: { fontSize: 12 },
});
