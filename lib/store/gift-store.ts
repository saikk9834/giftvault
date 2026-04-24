import AsyncStorage from '@react-native-async-storage/async-storage';
import { Gift, GiftFilters, GiftSortKey } from '../types';

const GIFTS_KEY = '@giftvault:gifts';

// ─── Persistence ─────────────────────────────────────────────────────────────

async function loadGifts(): Promise<Gift[]> {
  try {
    const raw = await AsyncStorage.getItem(GIFTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveGifts(gifts: Gift[]): Promise<void> {
  await AsyncStorage.setItem(GIFTS_KEY, JSON.stringify(gifts));
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getAllGifts(): Promise<Gift[]> {
  return loadGifts();
}

export async function addGift(gift: Omit<Gift, 'id' | 'createdAt' | 'updatedAt'>): Promise<Gift> {
  const gifts = await loadGifts();
  const now = new Date().toISOString();
  const newGift: Gift = {
    ...gift,
    id: `gift_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    createdAt: now,
    updatedAt: now,
  };
  gifts.unshift(newGift);
  await saveGifts(gifts);
  return newGift;
}

export async function updateGift(id: string, updates: Partial<Omit<Gift, 'id' | 'createdAt'>>): Promise<Gift | null> {
  const gifts = await loadGifts();
  const idx = gifts.findIndex((g) => g.id === id);
  if (idx === -1) return null;
  gifts[idx] = { ...gifts[idx], ...updates, updatedAt: new Date().toISOString() };
  await saveGifts(gifts);
  return gifts[idx];
}

export async function deleteGift(id: string): Promise<void> {
  const gifts = await loadGifts();
  await saveGifts(gifts.filter((g) => g.id !== id));
}

export async function getGiftById(id: string): Promise<Gift | null> {
  const gifts = await loadGifts();
  return gifts.find((g) => g.id === id) ?? null;
}

// ─── Filter & Sort ────────────────────────────────────────────────────────────

export function applyFilters(gifts: Gift[], filters: GiftFilters): Gift[] {
  let result = [...gifts];

  // Search
  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.tags.some((t) => t.toLowerCase().includes(q)) ||
        g.notes?.toLowerCase().includes(q)
    );
  }

  // Occasion filter
  if (filters.occasion !== 'all') {
    result = result.filter((g) => g.occasion === filters.occasion);
  }

  // Tag filter
  if (filters.tags.length > 0) {
    result = result.filter((g) => filters.tags.every((t) => g.tags.includes(t)));
  }

  // Sort
  result.sort((a, b) => {
    switch (filters.sortKey) {
      case 'date_desc':
        return new Date(b.dateReceived).getTime() - new Date(a.dateReceived).getTime();
      case 'date_asc':
        return new Date(a.dateReceived).getTime() - new Date(b.dateReceived).getTime();
      case 'name_asc':
        return a.title.localeCompare(b.title);
      case 'name_desc':
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });

  return result;
}
