import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/ui/avatar';
import { GradientButton } from '@/components/ui/gradient-button';
import { EmptyState } from '@/components/ui/empty-state';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/hooks/use-auth';
import { trpc } from '@/lib/trpc';

type FriendRow = {
  id: number;
  requesterId: number;
  addresseeId: number;
  status: 'accepted' | 'pending_sent' | 'pending_received';
  displayName: string;
  username: string;
};

function FriendCard({ friend, onAccept, onRemove }: {
  friend: FriendRow;
  onAccept?: () => void;
  onRemove?: () => void;
}) {
  const colors = useColors();
  const isPending = friend.status === 'pending_received';
  const isSent = friend.status === 'pending_sent';

  return (
    <View style={[styles.friendCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {isPending && (
        <LinearGradient
          colors={['#F59E0B', '#FBBF24']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.friendStrip}
        />
      )}
      <View style={styles.friendBody}>
        <Avatar name={friend.displayName} size={50} />
        <View style={styles.friendInfo}>
          <Text style={[styles.friendName, { color: colors.foreground }]}>{friend.displayName}</Text>
          <Text style={[styles.friendUsername, { color: colors.muted }]}>@{friend.username}</Text>
          {isPending && (
            <View style={[styles.statusBadge, { backgroundColor: '#F59E0B22', borderColor: '#F59E0B44' }]}>
              <IconSymbol name="bell.fill" size={10} color="#F59E0B" />
              <Text style={[styles.statusText, { color: '#F59E0B' }]}>Wants to connect</Text>
            </View>
          )}
          {isSent && (
            <View style={[styles.statusBadge, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
              <IconSymbol name="clock.fill" size={10} color={colors.muted} />
              <Text style={[styles.statusText, { color: colors.muted }]}>Request sent</Text>
            </View>
          )}
        </View>
        <View style={styles.friendActions}>
          {isPending && onAccept && (
            <Pressable
              onPress={onAccept}
              style={[styles.iconBtn, { backgroundColor: '#22C55E22', borderColor: '#22C55E44' }]}
            >
              <IconSymbol name="checkmark" size={16} color="#22C55E" />
            </Pressable>
          )}
          {onRemove && (
            <Pressable
              onPress={onRemove}
              style={[styles.iconBtn, { backgroundColor: '#EF444411', borderColor: '#EF444433' }]}
            >
              <IconSymbol name="xmark" size={16} color="#EF4444" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

export default function FriendsScreen() {
  const colors = useColors();
  const { user, isAuthenticated } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [adding, setAdding] = useState(false);

  const utils = trpc.useUtils();
  const { data: rawFriends = [], refetch } = trpc.friends.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const sendRequest = trpc.friends.sendRequest.useMutation({
    onSuccess: () => utils.friends.list.invalidate(),
  });
  const acceptRequest = trpc.friends.accept.useMutation({
    onSuccess: () => utils.friends.list.invalidate(),
  });
  const removeFriend = trpc.friends.remove.useMutation({
    onSuccess: () => utils.friends.list.invalidate(),
  });

  useFocusEffect(useCallback(() => { if (isAuthenticated) refetch(); }, [isAuthenticated]));

  const friends: FriendRow[] = useMemo(() =>
    rawFriends.map((f) => {
      const isRequester = f.requesterId === user?.id;
      const otherId = isRequester ? f.addresseeId : f.requesterId;
      const status: FriendRow['status'] = f.status === 'accepted'
        ? 'accepted'
        : isRequester ? 'pending_sent' : 'pending_received';
      const displayName = (f as any).otherName ?? `User ${otherId}`;
      return {
        id: f.id,
        requesterId: f.requesterId,
        addresseeId: f.addresseeId,
        status,
        displayName,
        username: displayName.toLowerCase().replace(/\s+/g, ''),
      };
    }),
    [rawFriends, user]
  );

  const handleAddFriend = async () => {
    const query = searchInput.trim().replace('@', '');
    if (!query) {
      if (Platform.OS === 'web') window.alert('Please enter a username to add.');
      else Alert.alert('Enter a Username', 'Please enter a username to add.');
      return;
    }
    setAdding(true);
    try {
      const results = await utils.friends.search.fetch({ query });
      if (!results || results.length === 0) {
        if (Platform.OS === 'web') window.alert(`No user found for "${query}". Make sure they have a GiftVault account.`);
        else Alert.alert('User Not Found', `No user found for "${query}". Make sure they have a GiftVault account.`);
        return;
      }
      const target = results[0];
      await sendRequest.mutateAsync({ addresseeId: target.id });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSearchInput('');
      setShowAdd(false);
      if (Platform.OS === 'web') window.alert(`Friend request sent to ${target.name ?? query}`);
      else Alert.alert('Request Sent!', `Friend request sent to ${target.name ?? query}`);
    } catch (e: any) {
      if (Platform.OS === 'web') window.alert(e?.message ?? 'Failed to send friend request.');
      else Alert.alert('Error', e?.message ?? 'Failed to send friend request.');
    } finally {
      setAdding(false);
    }
  };

  const handleAccept = async (id: number) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await acceptRequest.mutateAsync({ friendId: id });
  };

  const handleRemove = (friend: FriendRow) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove ${friend.displayName} from your friends?`)) {
        removeFriend.mutate({ friendId: friend.id });
      }
    } else {
      Alert.alert(
        'Remove Friend',
        `Remove ${friend.displayName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => removeFriend.mutate({ friendId: friend.id }) },
        ]
      );
    }
  };

  const accepted = friends.filter((f) => f.status === 'accepted');
  const pending = friends.filter((f) => f.status === 'pending_received' || f.status === 'pending_sent');

  if (!isAuthenticated) {
    return (
      <ScreenContainer>
        <EmptyState
          emoji="👥"
          title="Sign in to connect with friends"
          subtitle="Add friends and send them interactive surprise gifts."
          actionLabel="Sign In"
          onAction={() => router.push('/login' as any)}
        />
      </ScreenContainer>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <LinearGradient
          colors={['#0C4A6E', '#0369A1', '#0EA5E9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroOrb1} />
          <View style={styles.heroOrb2} />
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroTitle}>Friends 👥</Text>
              <Text style={styles.heroSub}>
                {accepted.length} connected · {pending.length} pending
              </Text>
            </View>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowAdd(!showAdd);
              }}
              style={({ pressed }) => [styles.addFab, pressed && { transform: [{ scale: 0.9 }] }]}
            >
              <LinearGradient
                colors={showAdd
                  ? ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.25)']
                  : ['rgba(255,255,255,0.28)', 'rgba(255,255,255,0.14)']}
                style={styles.addFabGradient}
              >
                <IconSymbol name={showAdd ? 'xmark' : 'person.badge.plus'} size={20} color="#fff" />
              </LinearGradient>
            </Pressable>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{accepted.length}</Text>
              <Text style={styles.statLabel}>Connected</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{pending.length}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{accepted.length + pending.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Add Friend Panel */}
        {showAdd && (
          <View style={[styles.addPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <LinearGradient
              colors={['#8B5CF608', '#EC489908']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[styles.addTitle, { color: colors.foreground }]}>Add a Friend</Text>
            <Text style={[styles.addSub, { color: colors.muted }]}>
              Search by name or username to connect and send surprise gifts.
            </Text>
            <View style={styles.addRow}>
              <View style={[styles.inputWrap, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                <Text style={[styles.atSign, { color: colors.muted }]}>@</Text>
                <TextInput
                  value={searchInput}
                  onChangeText={setSearchInput}
                  placeholder="username or name"
                  placeholderTextColor={colors.muted}
                  style={[styles.addInput, { color: colors.foreground }]}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleAddFriend}
                />
              </View>
              <GradientButton
                title="Add"
                onPress={handleAddFriend}
                loading={adding}
                fullWidth={false}
                size="sm"
              />
            </View>
            <View style={[styles.divider, { borderColor: colors.border }]} />
            <View style={styles.inviteRow}>
              <IconSymbol name="link" size={14} color={colors.muted} />
              <Text style={[styles.inviteText, { color: colors.muted }]}>
                Or share your invite:{' '}
                <Text style={{ color: colors.primary, fontWeight: '600' }}>giftvault.app/invite/me</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Pending requests */}
        {pending.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.muted }]}>Pending</Text>
              <View style={[styles.sectionBadge, { backgroundColor: '#F59E0B22', borderColor: '#F59E0B44' }]}>
                <Text style={[styles.sectionBadgeText, { color: '#F59E0B' }]}>{pending.length}</Text>
              </View>
            </View>
            {pending.map((f) => (
              <FriendCard
                key={f.id}
                friend={f}
                onAccept={f.status === 'pending_received' ? () => handleAccept(f.id) : undefined}
                onRemove={() => handleRemove(f)}
              />
            ))}
          </View>
        )}

        {/* Connected friends */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>Connected</Text>
            {accepted.length > 0 && (
              <View style={[styles.sectionBadge, { backgroundColor: '#22C55E22', borderColor: '#22C55E44' }]}>
                <Text style={[styles.sectionBadgeText, { color: '#22C55E' }]}>{accepted.length}</Text>
              </View>
            )}
          </View>
          {accepted.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.emptyEmoji}>👥</Text>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No friends yet</Text>
              <Text style={[styles.emptySub, { color: colors.muted }]}>
                Add friends to send and receive surprise gifts together.
              </Text>
              <Pressable
                onPress={() => setShowAdd(true)}
                style={[styles.emptyAction, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '33' }]}
              >
                <IconSymbol name="person.badge.plus" size={14} color={colors.primary} />
                <Text style={[styles.emptyActionText, { color: colors.primary }]}>Add your first friend</Text>
              </Pressable>
            </View>
          ) : (
            accepted.map((f) => (
              <FriendCard key={f.id} friend={f} onRemove={() => handleRemove(f)} />
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: 110 },

  hero: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  heroOrb1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -40,
  },
  heroOrb2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -30,
    left: 20,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  heroTitle: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.72)', marginTop: 4, fontWeight: '500' },
  addFab: { borderRadius: 24 },
  addFabGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  statDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },

  addPanel: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    overflow: 'hidden',
  },
  addTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  addSub: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
  addRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  atSign: { fontSize: 15, fontWeight: '600', marginRight: 4 },
  addInput: { flex: 1, fontSize: 15, height: 44 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, marginVertical: 14 },
  inviteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  inviteText: { flex: 1, fontSize: 13, lineHeight: 18 },

  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionBadge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  sectionBadgeText: { fontSize: 11, fontWeight: '700' },

  friendCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  friendStrip: { height: 3 },
  friendBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  friendInfo: { flex: 1 },
  friendName: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  friendUsername: { fontSize: 13, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  friendActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyActionText: { fontSize: 14, fontWeight: '700' },
});
