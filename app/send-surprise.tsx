import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';

import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { GradientButton } from '@/components/ui/gradient-button';
import { Avatar } from '@/components/ui/avatar';
import { Friend } from '@/lib/types';
import { getAllFriends } from '@/lib/store/friends-store';
import { addSurprise } from '@/lib/store/surprise-store';
import { getOrCreateProfile } from '@/lib/store/friends-store';

export default function SendSurpriseScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [giftContent, setGiftContent] = useState('');
  const [puzzle, setPuzzle] = useState('');
  const [answer, setAnswer] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(
    format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllFriends().then((f) => setFriends(f.filter((fr) => fr.status === 'accepted')));
  }, []);

  const handleSend = async () => {
    if (!selectedFriend) {
      Alert.alert('Select a Friend', 'Please choose who to send the surprise to.');
      return;
    }
    if (!giftContent.trim()) {
      Alert.alert('Add Gift Content', 'Describe what the surprise gift is.');
      return;
    }
    if (!puzzle.trim() || !answer.trim()) {
      Alert.alert('Add Puzzle', 'Please add a riddle and its answer.');
      return;
    }

    setSaving(true);
    try {
      const profile = await getOrCreateProfile();
      await addSurprise({
        senderId: profile.id,
        senderName: profile.displayName,
        recipientId: selectedFriend.id,
        recipientName: selectedFriend.displayName,
        giftContent: giftContent.trim(),
        puzzle: puzzle.trim(),
        answer: answer.trim().toLowerCase(),
        deliveryDate: new Date(deliveryDate).toISOString(),
      });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('Surprise Sent! 🎁', `Your surprise gift has been scheduled for ${selectedFriend.displayName}.`, [
        { text: 'Great!', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to send surprise. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <IconSymbol name="xmark" size={22} color={colors.muted} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Send Surprise</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Select Friend */}
        <Text style={[styles.stepLabel, { color: colors.muted }]}>1. Choose Recipient</Text>
        {friends.length === 0 ? (
          <View style={[styles.noFriends, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={styles.noFriendsEmoji}>👥</Text>
            <Text style={[styles.noFriendsText, { color: colors.muted }]}>
              Add friends first to send surprises
            </Text>
            <Pressable onPress={() => { router.back(); }}>
              <Text style={[styles.noFriendsAction, { color: colors.primary }]}>Go to Friends →</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendsRow}>
            {friends.map((friend) => (
              <Pressable
                key={friend.id}
                onPress={() => setSelectedFriend(friend)}
                style={[
                  styles.friendItem,
                  {
                    backgroundColor: selectedFriend?.id === friend.id ? colors.primary + '22' : colors.surface,
                    borderColor: selectedFriend?.id === friend.id ? colors.primary : colors.border,
                  },
                ]}
              >
                <Avatar name={friend.displayName} size={44} />
                <Text
                  style={[
                    styles.friendName,
                    { color: selectedFriend?.id === friend.id ? colors.primary : colors.foreground },
                  ]}
                  numberOfLines={1}
                >
                  {friend.displayName.split(' ')[0]}
                </Text>
                {selectedFriend?.id === friend.id && (
                  <IconSymbol name="checkmark.circle.fill" size={16} color={colors.primary} />
                )}
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Step 2: Gift Content */}
        <Text style={[styles.stepLabel, { color: colors.muted }]}>2. Gift Description</Text>
        <TextInput
          value={giftContent}
          onChangeText={setGiftContent}
          placeholder="Describe the surprise gift..."
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            styles.multilineInput,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground },
          ]}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Step 3: Puzzle */}
        <Text style={[styles.stepLabel, { color: colors.muted }]}>3. Puzzle / Riddle</Text>
        <TextInput
          value={puzzle}
          onChangeText={setPuzzle}
          placeholder="Write a riddle or puzzle for them to solve..."
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            styles.multilineInput,
            { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground },
          ]}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <Text style={[styles.label, { color: colors.muted }]}>Correct Answer</Text>
        <TextInput
          value={answer}
          onChangeText={setAnswer}
          placeholder="The answer (case-insensitive)"
          placeholderTextColor={colors.muted}
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
          autoCapitalize="none"
          returnKeyType="next"
        />

        {/* Step 4: Delivery Date */}
        <Text style={[styles.stepLabel, { color: colors.muted }]}>4. Delivery Date</Text>
        <TextInput
          value={deliveryDate}
          onChangeText={setDeliveryDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.muted}
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
          returnKeyType="done"
          keyboardType="numbers-and-punctuation"
        />

        {/* Preview */}
        {selectedFriend && giftContent && puzzle && answer && (
          <View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.primary + '44' }]}>
            <Text style={[styles.previewTitle, { color: colors.primary }]}>Preview</Text>
            <Text style={[styles.previewText, { color: colors.muted }]}>
              Sending to <Text style={{ color: colors.foreground, fontWeight: '700' }}>{selectedFriend.displayName}</Text>
              {' '}on <Text style={{ color: colors.foreground, fontWeight: '700' }}>{deliveryDate}</Text>
            </Text>
            <Text style={[styles.previewText, { color: colors.muted }]}>
              Riddle: "{puzzle.substring(0, 60)}{puzzle.length > 60 ? '...' : ''}"
            </Text>
          </View>
        )}

        {/* Send button */}
        <View style={styles.sendBtn}>
          <GradientButton
            title={saving ? 'Sending...' : 'Send Surprise 🎁'}
            onPress={handleSend}
            loading={saving}
            size="lg"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { padding: 20 },
  stepLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 12,
  },
  friendsRow: { marginBottom: 4 },
  friendItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 10,
    gap: 6,
    minWidth: 72,
  },
  friendName: { fontSize: 12, fontWeight: '600' },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  multilineInput: {
    height: 90,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  noFriends: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  noFriendsEmoji: { fontSize: 36 },
  noFriendsText: { fontSize: 14, textAlign: 'center' },
  noFriendsAction: { fontSize: 14, fontWeight: '700' },
  preview: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 20,
    gap: 6,
  },
  previewTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  previewText: { fontSize: 13, lineHeight: 20 },
  sendBtn: { marginTop: 28 },
});
