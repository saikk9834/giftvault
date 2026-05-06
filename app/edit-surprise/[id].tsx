import React, { useEffect, useState } from "react";
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
  ActivityIndicator,
  Keyboard,
  InteractionManager,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { format } from "date-fns";

import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { GradientButton } from "@/components/ui/gradient-button";
import { trpc } from "@/lib/trpc";

export default function EditSurpriseScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const numericId = Number(id);

  const { data: surprise, isLoading } = trpc.surprises.getById.useQuery(
    { id: numericId },
    { enabled: !!numericId },
  );

  const [giftContent, setGiftContent] = useState("");
  const [puzzle, setPuzzle] = useState("");
  // null = no image; string starting with 'data:' or 'http' = existing/new image
  const [puzzleImageUri, setPuzzleImageUri] = useState<string | null>(null);
  // tracks whether the image was changed by the user (vs loaded from server)
  const [puzzleImageChanged, setPuzzleImageChanged] = useState(false);
  const [answer, setAnswer] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (surprise) {
      setGiftContent(surprise.giftContent ?? "");
      setPuzzle(surprise.puzzle ?? "");
      setPuzzleImageUri((surprise as any).puzzleImage ?? null);
      setAnswer(surprise.answer === "***" ? "" : (surprise.answer ?? ""));
      const d =
        surprise.deliveryDate instanceof Date
          ? surprise.deliveryDate
          : new Date(surprise.deliveryDate as any);
      setDeliveryDate(format(d, "yyyy-MM-dd"));
    }
  }, [surprise]);

  const pickPuzzleImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
      quality: 0.7,
      base64: true,
    });
    const asset = result.assets?.[0];
    if (!result.canceled && asset?.base64) {
      setPuzzleImageUri(
        `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`,
      );
      setPuzzleImageChanged(true);
    }
  };

  const removePuzzleImage = () => {
    setPuzzleImageUri(null);
    setPuzzleImageChanged(true);
  };

  const utils = trpc.useUtils();
  // Invalidate AFTER navigation in handleSave — invalidating in onSuccess
  // races with the screen-back transition and crashes Fabric.
  const updateSurprise = trpc.surprises.update.useMutation();

  const handleSave = async () => {
    if (saving) return;
    if (!giftContent.trim()) {
      if (Platform.OS === "web") {
        window.alert("Please describe the surprise gift.");
      } else {
        Alert.alert("Add Gift Content", "Please describe the surprise gift.");
      }
      return;
    }
    if (!puzzle.trim() || !answer.trim()) {
      if (Platform.OS === "web") {
        window.alert("Please fill in both the riddle and the answer.");
      } else {
        Alert.alert(
          "Add Puzzle",
          "Please fill in both the riddle and the answer.",
        );
      }
      return;
    }

    Keyboard.dismiss();
    setSaving(true);
    try {
      await updateSurprise.mutateAsync({
        id: numericId,
        giftContent: giftContent.trim(),
        puzzle: puzzle.trim(),
        ...(puzzleImageChanged ? { puzzleImage: puzzleImageUri } : {}),
        answer: answer.trim(),
        deliveryDate: new Date(deliveryDate).toISOString(),
      });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.back();
      setTimeout(() => {
        utils.surprises.list.invalidate();
        utils.surprises.getById.invalidate({ id: numericId });
      }, 400);
    } catch (e: any) {
      setSaving(false);
      if (Platform.OS === "web") {
        window.alert(e?.message ?? "Failed to save changes.");
      } else {
        Alert.alert("Error", e?.message ?? "Failed to save changes.");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
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
          Edit Surprise
        </Text>
        <View style={{ width: 22 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !surprise ? (
        <View style={styles.loadingCenter}>
          <Text style={{ color: colors.muted }}>Surprise not found.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.recipientLabel, { color: colors.muted }]}>
            To:{" "}
            <Text style={{ color: colors.foreground, fontWeight: "700" }}>
              {surprise.recipientName}
            </Text>
          </Text>

          <Text style={[styles.stepLabel, { color: colors.muted }]}>
            Gift Description
          </Text>
          <TextInput
            value={giftContent}
            onChangeText={setGiftContent}
            placeholder="Describe the surprise gift..."
            placeholderTextColor={colors.muted}
            style={[
              styles.input,
              styles.multilineInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <Text style={[styles.stepLabel, { color: colors.muted }]}>
            Puzzle / Riddle
          </Text>
          <TextInput
            value={puzzle}
            onChangeText={setPuzzle}
            placeholder="Write a riddle or puzzle..."
            placeholderTextColor={colors.muted}
            style={[
              styles.input,
              styles.multilineInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Puzzle image */}
          {puzzleImageUri ? (
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: puzzleImageUri }}
                style={styles.imagePreview}
                contentFit="cover"
              />
              <View style={styles.imageActions}>
                <Pressable
                  onPress={pickPuzzleImage}
                  style={[
                    styles.imageActionBtn,
                    {
                      borderColor: colors.primary + "55",
                      backgroundColor: colors.primary + "11",
                    },
                  ]}
                >
                  <IconSymbol name="pencil" size={13} color={colors.primary} />
                  <Text
                    style={[styles.imageActionText, { color: colors.primary }]}
                  >
                    Change
                  </Text>
                </Pressable>
                <Pressable
                  onPress={removePuzzleImage}
                  style={[
                    styles.imageActionBtn,
                    {
                      borderColor: (colors.error ?? "#EF4444") + "55",
                      backgroundColor: (colors.error ?? "#EF4444") + "11",
                    },
                  ]}
                >
                  <IconSymbol
                    name="trash"
                    size={13}
                    color={colors.error ?? "#EF4444"}
                  />
                  <Text
                    style={[
                      styles.imageActionText,
                      { color: colors.error ?? "#EF4444" },
                    ]}
                  >
                    Remove
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={pickPuzzleImage}
              style={[
                styles.addImageBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <IconSymbol
                name="photo.on.rectangle"
                size={16}
                color={colors.muted}
              />
              <Text style={[styles.addImageText, { color: colors.muted }]}>
                Add Puzzle Image (optional)
              </Text>
            </Pressable>
          )}

          <Text style={[styles.label, { color: colors.muted }]}>
            Correct Answer
          </Text>
          <TextInput
            value={answer}
            onChangeText={setAnswer}
            placeholder="The answer (case-insensitive)"
            placeholderTextColor={colors.muted}
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            autoCapitalize="none"
            returnKeyType="next"
          />

          <Text style={[styles.stepLabel, { color: colors.muted }]}>
            Delivery Date
          </Text>
          <TextInput
            value={deliveryDate}
            onChangeText={setDeliveryDate}
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
            returnKeyType="done"
            keyboardType="numbers-and-punctuation"
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
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { padding: 20 },
  recipientLabel: { fontSize: 14, marginBottom: 20 },
  stepLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 12,
  },
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
    textAlignVertical: "top",
  },
  addImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    alignSelf: "flex-start",
  },
  addImageText: { fontSize: 13, fontWeight: "500" },
  imageWrapper: { marginTop: 10 },
  imagePreview: { width: "100%", height: 160, borderRadius: 12 },
  imageActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  imageActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  imageActionText: { fontSize: 12, fontWeight: "600" },
  saveBtn: { marginTop: 28 },
});
