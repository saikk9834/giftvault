// ─── Data Models ────────────────────────────────────────────────────────────

export type Occasion =
  | 'birthday'
  | 'anniversary'
  | 'christmas'
  | 'wedding'
  | 'graduation'
  | 'valentines'
  | 'mothers_day'
  | 'fathers_day'
  | 'hanukkah'
  | 'other';

export const OCCASIONS: { value: Occasion; label: string; emoji: string }[] = [
  { value: 'birthday', label: 'Birthday', emoji: '🎂' },
  { value: 'anniversary', label: 'Anniversary', emoji: '💍' },
  { value: 'christmas', label: 'Christmas', emoji: '🎄' },
  { value: 'wedding', label: 'Wedding', emoji: '💒' },
  { value: 'graduation', label: 'Graduation', emoji: '🎓' },
  { value: 'valentines', label: "Valentine's", emoji: '❤️' },
  { value: 'mothers_day', label: "Mother's Day", emoji: '🌸' },
  { value: 'fathers_day', label: "Father's Day", emoji: '👔' },
  { value: 'hanukkah', label: 'Hanukkah', emoji: '🕎' },
  { value: 'other', label: 'Other', emoji: '🎁' },
];

export interface Gift {
  id: string;
  title: string;
  photos: string[];          // local URIs
  dateReceived: string;      // ISO date string
  occasion: Occasion;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SurpriseGift {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  recipientName: string;
  giftContent: string;       // text description of the gift
  giftImage?: string;        // local URI or URL
  puzzle: string;            // riddle/puzzle text
  puzzleImage?: string;      // optional image for puzzle
  answer: string;            // correct answer (lowercased)
  deliveryDate: string;      // ISO date string
  isUnlocked: boolean;
  unlockedAt?: string;
  createdAt: string;
}

export interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  status: 'pending_sent' | 'pending_received' | 'accepted';
  connectedAt?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  createdAt: string;
}

// ─── Sort & Filter ───────────────────────────────────────────────────────────

export type GiftSortKey = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc';

export interface GiftFilters {
  search: string;
  occasion: Occasion | 'all';
  tags: string[];
  sortKey: GiftSortKey;
}
