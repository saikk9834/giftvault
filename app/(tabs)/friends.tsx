import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  Platform,
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

function FriendRowItem({ friend, onAccept, onRemove }: {
  friend: FriendRow;
  onAccept?: () => void;
  onRemove?: () => void;
}) {
  const colors = useColors();
  const isPending = friend.status === 'pending_received';
  const isSent = friend.status === 'pending_sent';

  return (
    <View style={[styles.friendRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Avatar name={friend.displayName} size={46} />
      <View style={styles.friendInfo}>
        <Text style={[styles.friendName, { color: colors.foreground }]}>{friend.displayName}</Text>
        <Text style={[styles.friendUsername, { color: colors.muted }]}>@{friend.username}</Text>
        {isPending && (
          <View style={[styles.pendingBadge, { backgroundColor: (colors.warning ?? '#F59E0B') + '22', borderColor: (colors.warning ?? '#F59E0B') + '44' }]}>
            <Text style={[styles.pendingText, { color: colors.warning ?? '#F59E0B' }]}>Wants to connect</Text>
          </View>
        )}
        {isSent && (
          <View style={[styles.pendingBadge, { backgroundColor: colors.muted + '22', borderColor: colors.border }]}>
            <Text style={[styles.pendingText, { color: colors.muted }]}>Request sent</Text>
          </View>
        )}
      </View>
      <View style={styles.friendActions}>
        {isPending && onAccept && (
          <Pressable
            onPress={onAccept}
            style={[styles.actionBtn, { backgroundColor: (colors.success ?? '#22C55E') + '22', borderColor: (colors.success ?? '#22C55E') + '44' }]}
          >
            <IconSymbol name="checkmark" size={16} color={colors.success ?? '#22C55E'} />
          </Pressable>
        )}
        {onRemove && (
          <Pressable
            onPress={onRemove}
            style={[styles.actionBtn, { backgroundColor: (colors.error ?? '#EF4444') + '11', borderColor: (colors.error ?? '#EF4444') + '33' }]}
          >
            <IconSymbol name="xmark" size={16} color={colors.error ?? '#EF4444'} />
          </Pressable>
        )}
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
  const searchUser = trpc.friends.search.useQuery(
    { query: searchInput.trim() },
    { enabled: false }
  );
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

  // Normalize friends list — otherName is now joined from the users table server-side
  const friends: FriendRow[] = useMemo(() =>
    rawFriends.map((f) => {
      const isRequester = f.requesterId === user?.id;
      const otherId = isRequester ? f.addresseeId : f.requesterId;
      const status: FriendRow['status'] = f.status === 'accepted'
        ? 'accepted'
        : isRequester ? 'pending_sent' : 'pending_received';
      // otherName is provided by the server (joined from users table)
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
      if (Platform.OS === 'web') {
        window.alert('Please enter a username to add.');
      } else {
        Alert.alert('Enter a Username', 'Please enter a username to add.');
      }
      return;
    }
    setAdding(true);
    try {
      // Search for user by username/name
      const results = await utils.friends.search.fetch({ query });
      if (!results || results.length === 0) {
        if (Platform.OS === 'web') {
          window.alert(`No user found for "${query}". Make sure they have a GiftVault account.`);
        } else {
          Alert.alert('User Not Found', `No user found for "${query}". Make sure they have a GiftVault account.`);
        }
        return;
      }
      const target = results[0];
      await sendRequest.mutateAsync({ addresseeId: target.id });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setSearchInput('');
      setShowAdd(false);
      if (Platform.OS === 'web') {
        window.alert(`Friend request sent to ${target.name ?? query}`);
      } else {
        Alert.alert('Request Sent!', `Friend request sent to ${target.name ?? query}`);
      }
    } catch (e: any) {
      if (Platform.OS === 'web') {
        window.alert(e?.message ?? 'Failed to send friend request.');
      } else {
        Alert.alert('Error', e?.message ?? 'Failed to send friend request.');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleAccept = async (id: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
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
        `Remove ${friend.displayName} from your friends?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              await removeFriend.mutateAsync({ friendId: friend.id });
            },
          },
        ]
      );
    }
  };

  const accepted = friends.filter((f) => f.status === 'accepted');
  const pending = friends.filter((f) => f.status === 'pending_received' || f.status === 'pending_sent');

  if (!isAuthenticated) {
    return (
      <ScreenContainer containerClassName="bg-background">
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
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Friends</Text>
          <Text style={[styles.headerSub, { color: colors.muted }]}>
            {accepted.length} connected
          </Text>
        </View>
        <Pressable
          onPress={() => setShowAdd(!showAdd)}
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
        >
          <LinearGradient
            colors={showAdd ? ['#F472B6', '#C084FC'] : ['#C084FC', '#F472B6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addBtn}
          >
            <IconSymbol name={showAdd ? 'xmark' : 'person.badge.plus'} size={20} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>

      {/* Add Friend Panel */}
      {showAdd && (
        <View style={[styles.addPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.addPanelTitle, { color: colors.foreground }]}>Add a Friend</Text>
          <Text style={[styles.addPanelSub, { color: colors.muted }]}>
            Search by username to connect and send surprise gifts.
          </Text>
          <View style={styles.addInputRow}>
            <View style={[styles.addInputWrap, { backgroundColor: colors.surface2 ?? colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.atSign, { color: colors.muted }]}>@</Text>
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder="username"
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
            <IconSymbol name="link" size={16} color={colors.muted} />
            <Text style={[styles.inviteText, { color: colors.muted }]}>
              Or share your invite link:{' '}
              <Text style={{ color: colors.primary }}>giftvault.app/invite/me</Text>
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={[]}
        renderItem={null}
        ListHeaderComponent={
          <View>
            {/* Pending requests */}
            {pending.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.muted }]}>Pending</Text>
                {pending.map((f) => (
                  <FriendRowItem
                    key={f.id}
                    friend={f}
                    onAccept={f.status === 'pending_received' ? () => handleAccept(f.id) : undefined}
                    onRemove={() => handleRemove(f)}
                  />
                ))}
              </>
            )}

            {/* Connected friends */}
            <Text style={[styles.sectionTitle, { color: colors.muted, marginTop: pending.length > 0 ? 20 : 0 }]}>
              Connected
            </Text>
            {accepted.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={styles.emptyEmoji}>👥</Text>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No friends yet</Text>
                <Text style={[styles.emptySub, { color: colors.muted }]}>
                  Add friends to send and receive surprise gifts.
                </Text>
              </View>
            ) : (
              accepted.map((f) => (
                <FriendRowItem key={f.id} friend={f} onRemove={() => handleRemove(f)} />
              ))
            )}
          </View>
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  headerSub: { fontSize: 13, marginTop: 2 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPanel: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  addPanelTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  addPanelSub: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
  addInputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  addInputWrap: {
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
  divider: { borderTopWidth: 1, marginVertical: 14 },
  inviteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  inviteText: { flex: 1, fontSize: 13, lineHeight: 18 },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  friendInfo: { flex: 1 },
  friendName: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  friendUsername: { fontSize: 13, marginTop: 1 },
  pendingBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  pendingText: { fontSize: 11, fontWeight: '600' },
  friendActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
