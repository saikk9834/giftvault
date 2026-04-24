import React, { useCallback, useState } from 'react';
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

import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Avatar } from '@/components/ui/avatar';
import { GradientButton } from '@/components/ui/gradient-button';
import { useColors } from '@/hooks/use-colors';
import { Friend } from '@/lib/types';
import { getAllFriends, addFriend, acceptFriendRequest, removeFriend } from '@/lib/store/friends-store';

function FriendRow({ friend, onAccept, onRemove }: {
  friend: Friend;
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
          <View style={[styles.pendingBadge, { backgroundColor: colors.warning + '22', borderColor: colors.warning + '44' }]}>
            <Text style={[styles.pendingText, { color: colors.warning }]}>Wants to connect</Text>
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
            style={[styles.actionBtn, { backgroundColor: colors.success + '22', borderColor: colors.success + '44' }]}
          >
            <IconSymbol name="checkmark" size={16} color={colors.success} />
          </Pressable>
        )}
        {onRemove && (
          <Pressable
            onPress={onRemove}
            style={[styles.actionBtn, { backgroundColor: colors.error + '11', borderColor: colors.error + '33' }]}
          >
            <IconSymbol name="xmark" size={16} color={colors.error} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function FriendsScreen() {
  const colors = useColors();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [adding, setAdding] = useState(false);

  const loadFriends = useCallback(async () => {
    const f = await getAllFriends();
    setFriends(f);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFriends();
    }, [loadFriends])
  );

  const handleAddFriend = async () => {
    const username = searchInput.trim().toLowerCase().replace('@', '');
    if (!username) {
      Alert.alert('Enter a Username', 'Please enter a username to add.');
      return;
    }
    const exists = friends.some((f) => f.username === username);
    if (exists) {
      Alert.alert('Already Added', 'This person is already in your friends list.');
      return;
    }
    setAdding(true);
    try {
      await addFriend({
        username,
        displayName: username.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        status: 'pending_sent',
      });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setSearchInput('');
      setShowAdd(false);
      await loadFriends();
      Alert.alert('Request Sent!', `Friend request sent to @${username}`);
    } finally {
      setAdding(false);
    }
  };

  const handleAccept = async (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await acceptFriendRequest(id);
    await loadFriends();
  };

  const handleRemove = (friend: Friend) => {
    Alert.alert(
      'Remove Friend',
      `Remove ${friend.displayName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeFriend(friend.id);
            await loadFriends();
          },
        },
      ]
    );
  };

  const accepted = friends.filter((f) => f.status === 'accepted');
  const pending = friends.filter((f) => f.status === 'pending_received' || f.status === 'pending_sent');

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
            <View style={[styles.addInputWrap, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
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
                  <FriendRow
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
                <FriendRow key={f.id} friend={f} onRemove={() => handleRemove(f)} />
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
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  addPanelTitle: { fontSize: 17, fontWeight: '700' },
  addPanelSub: { fontSize: 13, lineHeight: 18 },
  addInputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  addInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  atSign: { fontSize: 15, fontWeight: '600' },
  addInput: { flex: 1, fontSize: 15 },
  divider: { borderTopWidth: 1, marginVertical: 4 },
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
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  friendInfo: { flex: 1 },
  friendName: { fontSize: 15, fontWeight: '700' },
  friendUsername: { fontSize: 13, marginTop: 2 },
  pendingBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  pendingText: { fontSize: 10, fontWeight: '700' },
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
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
