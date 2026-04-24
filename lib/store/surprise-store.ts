import AsyncStorage from '@react-native-async-storage/async-storage';
import { SurpriseGift } from '../types';

const SURPRISES_KEY = '@giftvault:surprises';

async function loadSurprises(): Promise<SurpriseGift[]> {
  try {
    const raw = await AsyncStorage.getItem(SURPRISES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveSurprises(surprises: SurpriseGift[]): Promise<void> {
  await AsyncStorage.setItem(SURPRISES_KEY, JSON.stringify(surprises));
}

export async function getAllSurprises(): Promise<SurpriseGift[]> {
  return loadSurprises();
}

export async function addSurprise(
  surprise: Omit<SurpriseGift, 'id' | 'isUnlocked' | 'createdAt'>
): Promise<SurpriseGift> {
  const surprises = await loadSurprises();
  const now = new Date().toISOString();
  const newSurprise: SurpriseGift = {
    ...surprise,
    id: `surprise_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    isUnlocked: false,
    createdAt: now,
  };
  surprises.unshift(newSurprise);
  await saveSurprises(surprises);
  return newSurprise;
}

export async function unlockSurprise(id: string): Promise<SurpriseGift | null> {
  const surprises = await loadSurprises();
  const idx = surprises.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  surprises[idx] = {
    ...surprises[idx],
    isUnlocked: true,
    unlockedAt: new Date().toISOString(),
  };
  await saveSurprises(surprises);
  return surprises[idx];
}

export async function getSurpriseById(id: string): Promise<SurpriseGift | null> {
  const surprises = await loadSurprises();
  return surprises.find((s) => s.id === id) ?? null;
}

export async function deleteSurprise(id: string): Promise<void> {
  const surprises = await loadSurprises();
  await saveSurprises(surprises.filter((s) => s.id !== id));
}

export function validateAnswer(surprise: SurpriseGift, attempt: string): boolean {
  return attempt.trim().toLowerCase() === surprise.answer.trim().toLowerCase();
}
