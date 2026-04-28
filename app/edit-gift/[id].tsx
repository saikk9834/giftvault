import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { format } from "date-fns";
import DateTimePicker from "@react-native-community/datetimepicker";

import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GradientButton } from "@/components/ui/gradient-button";
import { TagChip } from "@/components/ui/tag-chip";
import { Occasion, OCCASIONS } from "@/lib/types";
import { trpc } from "@/lib/trpc";

export default function EditGiftScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const numericId = id ? parseInt(id, 10) : 0;
  const utils = trpc.useUtils();

  const { data: rawGift, isLoading } = trpc.gifts.getById.useQuery(
    { id: numericId },
    { enabled: !!id && !isNaN(numericId) },
  );

  const [title, setTitle] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [dateReceived, setDateReceived] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [occasion, setOccasion] = useState<Occasion>("other");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (rawGift && !loaded) {
      setTitle(rawGift.title);
      const parsedPhotos: string[] = (() => {
        try {
          return JSON.parse(rawGift.photos ?? "[]") ?? [];
        } catch {
          return [];
        }
      })();
      setPhotos(parsedPhotos);
      const parsedTags: string[] = (() => {
        try {
          return JSON.parse(rawGift.tags ?? "[]") ?? [];
        } catch {
          return [];
        }
      })();
      setTags(parsedTags);
      setNotes(rawGift.notes ?? "");
      setOccasion((rawGift.occasion as Occasion) ?? "other");
      const d = new Date(rawGift.dateReceived);
      setDateReceived(isNaN(d.getTime()) ? new Date() : d);
      setLoaded(true);
    }
  }, [rawGift, loaded]);

  // Invalidate AFTER navigation in handleSave — invalidating in onSuccess
  // races with the screen-back transition and crashes Fabric.
  const updateGift = trpc.gifts.update.useMutation();

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
      base64: true,
      selectionLimit: 5 - photos.length,
    });
    if (!result.canceled) {
      const dataUris = result.assets
        .filter((a) => a.base64)
        .map((a) => `data:${a.mimeType ?? "image/jpeg"};base64,${a.base64}`);
      setPhotos((prev) => [...prev, ...dataUris].slice(0, 5));
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (tag && !tags.includes(tag)) setTags((prev) => [...prev, tag]);
    setTagInput("");
  };

  const handleSave = async () => {
    if (saving) return;
    if (!title.trim()) {
      Alert.alert("Missing Title", "Please enter a name for this gift.");
      return;
    }
    Keyboard.dismiss();
    setSaving(true);
    try {
      await updateGift.mutateAsync({
        id: numericId,
        title: title.trim(),
        photos,
        dateReceived: format(dateReceived, "yyyy-MM-dd"),
        occasion,
        tags,
        notes: notes.trim() || null,
      });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.back();
      setTimeout(() => {
        utils.gifts.list.invalidate();
        utils.gifts.getById.invalidate({ id: numericId });
      }, 400);
    } catch (e: any) {
      setSaving(false);
      if (e?.data?.code === "UNAUTHORIZED") {
        router.push("/login" as any);
        return;
      }
      Alert.alert("Error", "Failed to save changes. Please try again.");
    }
  };

  if (isLoading || !rawGift) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={[{ color: colors.muted, fontSize: 16 }]}>
          {isLoading ? "Loading..." : "Gift not found"}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8, borderBottomColor: colors.border },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <IconSymbol name="xmark" size={22} color={colors.muted} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Edit Gift
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Photos */}
        <Text style={[styles.label, { color: colors.muted }]}>Photos</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.photoRow}
        >
          {photos.map((uri, i) => (
            <View key={i} style={styles.photoWrapper}>
              <Image source={{ uri }} style={styles.photo} contentFit="cover" />
              <Pressable
                onPress={() =>
                  setPhotos((prev) => prev.filter((_, idx) => idx !== i))
                }
                style={[styles.removePhoto, { backgroundColor: colors.error }]}
              >
                <IconSymbol name="xmark" size={12} color="#fff" />
              </Pressable>
            </View>
          ))}
          {photos.length < 5 && (
            <Pressable
              onPress={pickPhoto}
              style={[
                styles.addPhoto,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <IconSymbol name="camera.fill" size={24} color={colors.muted} />
              <Text style={[styles.addPhotoText, { color: colors.muted }]}>
                Add Photo
              </Text>
            </Pressable>
          )}
        </ScrollView>

        {/* Title */}
        <Text style={[styles.label, { color: colors.muted }]}>Gift Name *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Rose Gold Watch"
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          returnKeyType="next"
        />

        {/* Date Received */}
        <Text style={[styles.label, { color: colors.muted }]}>
          Date Received
        </Text>
        {Platform.OS === "web" ? (
          <TextInput
            value={format(dateReceived, "yyyy-MM-dd")}
            onChangeText={(v) => {
              const d = new Date(v);
              if (!isNaN(d.getTime())) setDateReceived(d);
            }}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.muted}
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            returnKeyType="next"
            keyboardType="numbers-and-punctuation"
          />
        ) : (
          <>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={[
                styles.datePicker,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <IconSymbol name="calendar" size={18} color={colors.primary} />
              <Text
                style={[styles.datePickerText, { color: colors.foreground }]}
              >
                {format(dateReceived, "MMMM d, yyyy")}
              </Text>
              <IconSymbol name="chevron.right" size={14} color={colors.muted} />
            </Pressable>

            {Platform.OS === "android" && showDatePicker && (
              <DateTimePicker
                value={dateReceived}
                mode="date"
                maximumDate={new Date()}
                onChange={(_, date) => {
                  setShowDatePicker(false);
                  if (date) setDateReceived(date);
                }}
              />
            )}

            {Platform.OS === "ios" && (
              <Modal visible={showDatePicker} transparent animationType="slide">
                <Pressable
                  style={styles.dateModalBackdrop}
                  onPress={() => setShowDatePicker(false)}
                />
                <View
                  style={[
                    styles.dateModalSheet,
                    { backgroundColor: colors.surface },
                  ]}
                >
                  <View
                    style={[
                      styles.dateModalHeader,
                      { borderBottomColor: colors.border },
                    ]}
                  >
                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text
                        style={[
                          styles.dateModalDone,
                          { color: colors.primary },
                        ]}
                      >
                        Done
                      </Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={dateReceived}
                    mode="date"
                    display="spinner"
                    maximumDate={new Date()}
                    onChange={(_, date) => {
                      if (date) setDateReceived(date);
                    }}
                    style={{ height: 200 }}
                  />
                </View>
              </Modal>
            )}
          </>
        )}

        {/* Occasion */}
        <Text style={[styles.label, { color: colors.muted }]}>Occasion</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.occasionRow}
        >
          {OCCASIONS.map((occ) => (
            <Pressable
              key={occ.value}
              onPress={() => setOccasion(occ.value)}
              style={[
                styles.occasionChip,
                {
                  backgroundColor:
                    occasion === occ.value
                      ? colors.primary + "33"
                      : colors.surface,
                  borderColor:
                    occasion === occ.value ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={styles.occasionEmoji}>{occ.emoji}</Text>
              <Text
                style={[
                  styles.occasionLabel,
                  {
                    color:
                      occasion === occ.value ? colors.primary : colors.muted,
                  },
                ]}
              >
                {occ.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Tags */}
        <Text style={[styles.label, { color: colors.muted }]}>
          Tags (Optional)
        </Text>
        <View style={styles.tagInputRow}>
          <TextInput
            value={tagInput}
            onChangeText={setTagInput}
            placeholder="Add a tag..."
            placeholderTextColor={colors.muted}
            style={[
              styles.tagInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            onSubmitEditing={addTag}
            returnKeyType="done"
          />
          <Pressable
            onPress={addTag}
            style={[
              styles.tagAddBtn,
              {
                backgroundColor: colors.primary + "22",
                borderColor: colors.primary,
              },
            ]}
          >
            <IconSymbol name="plus" size={18} color={colors.primary} />
          </Pressable>
        </View>
        {tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.map((tag) => (
              <TagChip
                key={tag}
                label={tag}
                onRemove={() =>
                  setTags((prev) => prev.filter((t) => t !== tag))
                }
              />
            ))}
          </View>
        )}

        {/* Notes */}
        <Text style={[styles.label, { color: colors.muted }]}>
          Notes (optional)
        </Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Any special memories or details..."
          placeholderTextColor={colors.muted}
          style={[
            styles.input,
            styles.notesInput,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.foreground,
            },
          ]}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <View style={styles.saveBtn}>
          <GradientButton
            title={saving ? "Saving..." : "Save Changes"}
            onPress={handleSave}
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
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scroll: { padding: 20 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 16,
  },
  photoRow: { marginBottom: 4 },
  photoWrapper: { position: "relative", marginRight: 10 },
  photo: { width: 90, height: 90, borderRadius: 12 },
  removePhoto: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhoto: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addPhotoText: { fontSize: 10, fontWeight: "600" },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  notesInput: { height: 100, paddingTop: 12 },
  datePicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  datePickerText: { flex: 1, fontSize: 15, fontWeight: "500" },
  dateModalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  dateModalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  dateModalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  dateModalDone: { fontSize: 16, fontWeight: "700" },
  occasionRow: { marginBottom: 4 },
  occasionChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 5,
  },
  occasionEmoji: { fontSize: 16 },
  occasionLabel: { fontSize: 13, fontWeight: "600" },
  tagInputRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  tagInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  tagAddBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  saveBtn: { marginTop: 32 },
});
