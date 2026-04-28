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
  Modal,
  Keyboard,
  InteractionManager,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { GradientButton } from '@/components/ui/gradient-button';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { trpc } from '@/lib/trpc';

type FriendItem = { id: number; name: string | null };

export default function SendSurpriseScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [selectedFriend, setSelectedFriend] = useState<FriendItem | null>(null);
  const [giftContent, setGiftContent] = useState('');
  const [giftImageUri, setGiftImageUri] = useState<string | null>(null);
  const [puzzle, setPuzzle] = useState('');
  const [puzzleImageUri, setPuzzleImageUri] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000)
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickImage = async (onPick: (dataUri: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.7,
      base64: true,
    });
    const asset = result.assets?.[0];
    if (!result.canceled && asset?.base64) {
      onPick(`data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`);
    }
  };

  const utils = trpc.useUtils();
  const { data: rawFriends = [] } = trpc.friends.list.useQuery();
  const sendSurprise = trpc.surprises.send.useMutation({
    onSuccess: () => utils.surprises.list.invalidate(),
  });

  // Build accepted friend list — otherName is joined server-side in getFriendsForUser
  const friends = rawFriends
    .filter((f) => f.status === 'accepted')
    .map((f) => ({
      id: f.requesterId === user?.id ? f.addresseeId : f.requesterId,
      name: ((f as any).otherName as string | null) ?? null,
    }));

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

    Keyboard.dismiss();
    setSaving(true);
    try {
      await sendSurprise.mutateAsync({
        recipientId: selectedFriend.id,
        recipientName: selectedFriend.name ?? `User ${selectedFriend.id}`,
        giftContent: giftContent.trim(),
        giftImage: giftImageUri ?? undefined,
        puzzle: puzzle.trim(),
        puzzleImage: puzzleImageUri ?? undefined,
        answer: answer.trim(),
        deliveryDate: deliveryDate.toISOString(),
      });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setSaving(false);
      InteractionManager.runAfterInteractions(() => {
        router.back();
        Alert.alert('Surprise Sent! 🎁', 'Your surprise gift has been scheduled!');
      });
    } catch (e: any) {
      setSaving(false);
      if (e?.data?.code === 'UNAUTHORIZED') { router.push('/login' as any); return; }
      Alert.alert('Error', 'Failed to send surprise. Please try again.');
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
                <Avatar name={friend.name ?? `User ${friend.id}`} size={44} />
                <Text
                  style={[
                    styles.friendName,
                    { color: selectedFriend?.id === friend.id ? colors.primary : colors.foreground },
                  ]}
                  numberOfLines={1}
                >
                  {(friend.name ?? `User ${friend.id}`).split(' ')[0]}
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

        {/* Gift image (optional) */}
        {giftImageUri ? (
          <View style={styles.puzzleImageWrapper}>
            <Image source={{ uri: giftImageUri }} style={styles.puzzleImagePreview} contentFit="cover" />
            <Pressable
              onPress={() => setGiftImageUri(null)}
              style={[styles.puzzleImageRemove, { backgroundColor: colors.error }]}
            >
              <IconSymbol name="xmark" size={12} color="#fff" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => pickImage(setGiftImageUri)}
            style={[styles.addImageBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <IconSymbol name="photo.on.rectangle" size={16} color={colors.muted} />
            <Text style={[styles.addImageText, { color: colors.muted }]}>Add Gift Image (optional)</Text>
          </Pressable>
        )}

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

        {/* Puzzle image (optional) */}
        {puzzleImageUri ? (
          <View style={styles.puzzleImageWrapper}>
            <Image source={{ uri: puzzleImageUri }} style={styles.puzzleImagePreview} contentFit="cover" />
            <Pressable
              onPress={() => setPuzzleImageUri(null)}
              style={[styles.puzzleImageRemove, { backgroundColor: colors.error }]}
            >
              <IconSymbol name="xmark" size={12} color="#fff" />
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => pickImage(setPuzzleImageUri)}
            style={[styles.addImageBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <IconSymbol name="photo.on.rectangle" size={16} color={colors.muted} />
            <Text style={[styles.addImageText, { color: colors.muted }]}>Add Puzzle Image (optional)</Text>
          </Pressable>
        )}

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
        {Platform.OS === 'web' ? (
          <TextInput
            value={format(deliveryDate, 'yyyy-MM-dd')}
            onChangeText={(v) => { const d = new Date(v); if (!isNaN(d.getTime())) setDeliveryDate(d); }}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.muted}
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            returnKeyType="done"
            keyboardType="numbers-and-punctuation"
          />
        ) : (
          <>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={[styles.datePicker, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <IconSymbol name="calendar" size={18} color={colors.primary} />
              <Text style={[styles.datePickerText, { color: colors.foreground }]}>
                {format(deliveryDate, 'MMMM d, yyyy')}
              </Text>
              <IconSymbol name="chevron.right" size={14} color={colors.muted} />
            </Pressable>

            {/* Android: render inline (shows as system dialog) */}
            {Platform.OS === 'android' && showDatePicker && (
              <DateTimePicker
                value={deliveryDate}
                mode="date"
                minimumDate={new Date()}
                onChange={(_, date) => {
                  setShowDatePicker(false);
                  if (date) setDeliveryDate(date);
                }}
              />
            )}

            {/* iOS: render in a modal */}
            {Platform.OS === 'ios' && (
              <Modal visible={showDatePicker} transparent animationType="slide">
                <Pressable style={styles.dateModalBackdrop} onPress={() => setShowDatePicker(false)} />
                <View style={[styles.dateModalSheet, { backgroundColor: colors.surface }]}>
                  <View style={[styles.dateModalHeader, { borderBottomColor: colors.border }]}>
                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text style={[styles.dateModalDone, { color: colors.primary }]}>Done</Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={deliveryDate}
                    mode="date"
                    display="spinner"
                    minimumDate={new Date()}
                    onChange={(_, date) => { if (date) setDeliveryDate(date); }}
                    style={styles.datePickerIOS}
                  />
                </View>
              </Modal>
            )}
          </>
        )}

        {/* Preview */}
        {selectedFriend && giftContent && puzzle && answer && (
          <View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.primary + '44' }]}>
            <Text style={[styles.previewTitle, { color: colors.primary }]}>Preview</Text>
            <Text style={[styles.previewText, { color: colors.muted }]}>
              Sending to <Text style={{ color: colors.foreground, fontWeight: '700' }}>{selectedFriend.name ?? `User ${selectedFriend.id}`}</Text>
              {' '}on <Text style={{ color: colors.foreground, fontWeight: '700' }}>{format(deliveryDate, 'MMM d, yyyy')}</Text>
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
  addImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignSelf: 'flex-start',
  },
  addImageText: { fontSize: 13, fontWeight: '500' },
  puzzleImageWrapper: {
    marginTop: 10,
    alignSelf: 'flex-start',
    position: 'relative',
  },
  puzzleImagePreview: {
    width: 140,
    height: 100,
    borderRadius: 12,
  },
  puzzleImageRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  datePickerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  datePickerIOS: {
    height: 200,
  },
  dateModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  dateModalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  dateModalDone: {
    fontSize: 16,
    fontWeight: '700',
  },
});
