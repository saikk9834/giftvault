import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';

import { useColors } from '@/hooks/use-colors';
import { trpc } from '@/lib/trpc';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { OccasionBadge } from '@/components/ui/occasion-badge';
import { TagChip } from '@/components/ui/tag-chip';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function GiftDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activePhoto, setActivePhoto] = useState(0);
  const utils = trpc.useUtils();

  const numericId = id ? parseInt(id, 10) : 0;
  const { data: rawGift, isLoading } = trpc.gifts.getById.useQuery(
    { id: numericId },
    { enabled: !!id && !isNaN(numericId) }
  );

  const deleteMutation = trpc.gifts.delete.useMutation({
    onSuccess: () => {
      utils.gifts.list.invalidate();
      router.back();
    },
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Gift',
      'Are you sure you want to remove this gift from your vault?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            await deleteMutation.mutateAsync({ id: numericId });
          },
        },
      ]
    );
  };

  if (isLoading || !rawGift) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.muted }]}>{isLoading ? 'Loading...' : 'Gift not found'}</Text>
      </View>
    );
  }

  // Normalize DB row
  const gift = {
    ...rawGift,
    id: String(rawGift.id),
    photos: (() => { try { return JSON.parse(rawGift.photos); } catch { return []; } })() as string[],
    tags: (() => { try { return JSON.parse(rawGift.tags); } catch { return []; } })() as string[],
    notes: rawGift.notes ?? undefined,
  };

  const hasPhotos = gift.photos.length > 0;
  const formattedDate = (() => {
    try {
      return format(new Date(gift.dateReceived), 'MMMM d, yyyy');
    } catch {
      return gift.dateReceived;
    }
  })();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView bounces showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {hasPhotos ? (
            <Image
              source={{ uri: gift.photos[activePhoto] }}
              style={styles.heroImage}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <LinearGradient
              colors={['#1A1A2E', '#16213E', '#0D0D0F']}
              style={styles.heroImage}
            >
              <Text style={styles.heroEmoji}>🎁</Text>
            </LinearGradient>
          )}
          {/* Gradient overlay */}
          <LinearGradient
            colors={['rgba(13,13,15,0.5)', 'transparent', 'rgba(13,13,15,0.8)']}
            style={StyleSheet.absoluteFill}
          />
          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { top: insets.top + 12 }]}
          >
            <View style={[styles.iconBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
              <IconSymbol name="chevron.left" size={22} color="#fff" />
            </View>
          </Pressable>
          {/* Delete button */}
          <Pressable
            onPress={handleDelete}
            style={[styles.deleteBtn, { top: insets.top + 12 }]}
          >
            <View style={[styles.iconBtn, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
              <IconSymbol name="trash" size={20} color="#F87171" />
            </View>
          </Pressable>
          {/* Photo strip */}
          {hasPhotos && gift.photos.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.photoStrip}
              contentContainerStyle={styles.photoStripContent}
            >
              {gift.photos.map((uri, i) => (
                <Pressable key={i} onPress={() => setActivePhoto(i)}>
                  <Image
                    source={{ uri }}
                    style={[
                      styles.photoThumb,
                      i === activePhoto && styles.photoThumbActive,
                    ]}
                    contentFit="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Content */}
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {/* Title & Occasion */}
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={3}>
              {gift.title}
            </Text>
            <OccasionBadge occasion={gift.occasion} size="md" />
          </View>

          {/* Date */}
          <View style={[styles.metaRow, { borderColor: colors.border }]}>
            <IconSymbol name="calendar" size={18} color={colors.muted} />
            <Text style={[styles.metaText, { color: colors.muted }]}>{formattedDate}</Text>
          </View>

          {/* Tags */}
          {gift.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>Tags</Text>
              <View style={styles.tagsRow}>
                {gift.tags.map((tag) => (
                  <TagChip key={tag} label={tag} size="md" />
                ))}
              </View>
            </View>
          )}

          {/* Notes */}
          {gift.notes && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>Notes</Text>
              <View style={[styles.notesBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.notesText, { color: colors.foreground }]}>{gift.notes}</Text>
              </View>
            </View>
          )}

          {/* Added date */}
          <Text style={[styles.addedAt, { color: colors.muted }]}>
            Added {format(new Date(gift.createdAt), 'MMM d, yyyy')}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  heroContainer: {
    height: 320,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 80,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
  },
  deleteBtn: {
    position: 'absolute',
    right: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoStrip: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
  },
  photoStripContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  photoThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  photoThumbActive: {
    borderColor: '#C084FC',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  title: {
    flex: 1,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  metaText: {
    fontSize: 15,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  notesBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
  },
  addedAt: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});
