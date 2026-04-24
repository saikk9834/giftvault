import AsyncStorage from '@react-native-async-storage/async-storage';
import { Friend, UserProfile } from '../types';

const FRIENDS_KEY = '@giftvault:friends';
const PROFILE_KEY = '@giftvault:profile';

// ─── User Profile ─────────────────────────────────────────────────────────────

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function getOrCreateProfile(): Promise<UserProfile> {
  const existing = await getUserProfile();
  if (existing) return existing;
  const profile: UserProfile = {
    id: `user_${Date.now()}`,
    username: 'giftvault_user',
    displayName: 'Gift Lover',
    createdAt: new Date().toISOString(),
  };
  await saveUserProfile(profile);
  return profile;
}

// ─── Friends ──────────────────────────────────────────────────────────────────

async function loadFriends(): Promise<Friend[]> {
  try {
    const raw = await AsyncStorage.getItem(FRIENDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveFriends(friends: Friend[]): Promise<void> {
  await AsyncStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
}

export async function getAllFriends(): Promise<Friend[]> {
  return loadFriends();
}

export async function addFriend(friend: Omit<Friend, 'id'>): Promise<Friend> {
  const friends = await loadFriends();
  const newFriend: Friend = {
    ...friend,
    id: `friend_${Date.now()}_${Math.random().toString(36).slice(2)}`,
  };
  friends.push(newFriend);
  await saveFriends(friends);
  return newFriend;
}

export async function acceptFriendRequest(id: string): Promise<void> {
  const friends = await loadFriends();
  const idx = friends.findIndex((f) => f.id === id);
  if (idx !== -1) {
    friends[idx] = {
      ...friends[idx],
      status: 'accepted',
      connectedAt: new Date().toISOString(),
    };
    await saveFriends(friends);
  }
}

export async function removeFriend(id: string): Promise<void> {
  const friends = await loadFriends();
  await saveFriends(friends.filter((f) => f.id !== id));
}

// ─── Seed demo data ───────────────────────────────────────────────────────────

export async function seedDemoFriends(): Promise<void> {
  const existing = await loadFriends();
  if (existing.length > 0) return;
  const demos: Omit<Friend, 'id'>[] = [
    { username: 'alex_j', displayName: 'Alex Johnson', status: 'accepted', connectedAt: new Date().toISOString() },
    { username: 'sam_w', displayName: 'Sam Williams', status: 'accepted', connectedAt: new Date().toISOString() },
    { username: 'jordan_k', displayName: 'Jordan Kim', status: 'pending_received' },
  ];
  for (const d of demos) await addFriend(d);
}
