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
import { UserProfile } from '@/lib/types';
import { getOrCreateProfile, saveUserProfile } from '@/lib/store/friends-store';
import { getAllGifts } from '@/lib/store/gift-store';
import { getAllSurprises } from '@/lib/store/surprise-store';
import { getAllFriends } from '@/lib/store/friends-store';

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [stats, setStats] = useState({ gifts: 0, surprisesSent: 0, surprisesReceived: 0, friends: 0 });

  const loadData = useCallback(async () => {
    const [p, gifts, surprises, friends] = await Promise.all([
      getOrCreateProfile(),
      getAllGifts(),
      getAllSurprises(),
      getAllFriends(),
    ]);
    setProfile(p);
    setNewName(p.displayName);
    setStats({
      gifts: gifts.length,
      surprisesSent: surprises.filter((s) => s.senderId === p.id).length,
      surprisesReceived: surprises.filter((s) => s.recipientId === 'me').length,
      friends: friends.filter((f) => f.status === 'accepted').length,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSaveName = async () => {
    if (!profile || !newName.trim()) return;
    const updated = { ...profile, displayName: newName.trim() };
    await saveUserProfile(updated);
    setProfile(updated);
    setEditingName(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  if (!profile) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.muted }}>Loading...</Text>
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
          <Avatar name={profile.displayName} size={80} />
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
              <Text style={[styles.displayName, { color: colors.foreground }]}>{profile.displayName}</Text>
              <IconSymbol name="pencil" size={14} color={colors.muted} />
            </Pressable>
          )}
          <Text style={[styles.username, { color: colors.muted }]}>@{profile.username}</Text>
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
});
