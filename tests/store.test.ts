import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn().mockResolvedValue(null),
    setItem: vi.fn().mockResolvedValue(undefined),
    removeItem: vi.fn().mockResolvedValue(undefined),
  },
}));

import { applyFilters } from '../lib/store/gift-store';
import { validateAnswer } from '../lib/store/surprise-store';
import { Gift, SurpriseGift, GiftFilters } from '../lib/types';

const mockGifts: Gift[] = [
  {
    id: '1',
    title: 'Rose Gold Watch',
    photos: [],
    dateReceived: '2024-12-25',
    occasion: 'christmas',
    tags: ['luxury', 'jewelry'],
    notes: 'From grandma',
    createdAt: '2024-12-25T00:00:00Z',
    updatedAt: '2024-12-25T00:00:00Z',
  },
  {
    id: '2',
    title: 'Birthday Cake',
    photos: [],
    dateReceived: '2024-06-15',
    occasion: 'birthday',
    tags: ['food', 'sweet'],
    createdAt: '2024-06-15T00:00:00Z',
    updatedAt: '2024-06-15T00:00:00Z',
  },
];

describe('applyFilters', () => {
  const baseFilters: GiftFilters = {
    search: '',
    occasion: 'all',
    tags: [],
    sortKey: 'date_desc',
  };

  it('returns all gifts with no filters', () => {
    const result = applyFilters(mockGifts, baseFilters);
    expect(result).toHaveLength(2);
  });

  it('filters by search term', () => {
    const result = applyFilters(mockGifts, { ...baseFilters, search: 'watch' });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Rose Gold Watch');
  });

  it('filters by occasion', () => {
    const result = applyFilters(mockGifts, { ...baseFilters, occasion: 'birthday' });
    expect(result).toHaveLength(1);
    expect(result[0].occasion).toBe('birthday');
  });

  it('sorts by date descending', () => {
    const result = applyFilters(mockGifts, { ...baseFilters, sortKey: 'date_desc' });
    expect(result[0].dateReceived).toBe('2024-12-25');
  });

  it('sorts by date ascending', () => {
    const result = applyFilters(mockGifts, { ...baseFilters, sortKey: 'date_asc' });
    expect(result[0].dateReceived).toBe('2024-06-15');
  });

  it('sorts by name ascending', () => {
    const result = applyFilters(mockGifts, { ...baseFilters, sortKey: 'name_asc' });
    expect(result[0].title).toBe('Birthday Cake');
  });
});

describe('validateAnswer', () => {
  const mockSurprise: SurpriseGift = {
    id: 's1',
    senderId: 'user1',
    senderName: 'Alice',
    recipientId: 'me',
    recipientName: 'Bob',
    giftContent: 'A special surprise',
    puzzle: 'What has keys but no locks?',
    answer: 'piano',
    deliveryDate: '2024-01-01T00:00:00Z',
    isUnlocked: false,
    createdAt: '2024-01-01T00:00:00Z',
  };

  it('validates correct answer (exact match)', () => {
    expect(validateAnswer(mockSurprise, 'piano')).toBe(true);
  });

  it('validates correct answer (case insensitive)', () => {
    expect(validateAnswer(mockSurprise, 'PIANO')).toBe(true);
    expect(validateAnswer(mockSurprise, 'Piano')).toBe(true);
  });

  it('validates correct answer (with whitespace)', () => {
    expect(validateAnswer(mockSurprise, '  piano  ')).toBe(true);
  });

  it('rejects wrong answer', () => {
    expect(validateAnswer(mockSurprise, 'keyboard')).toBe(false);
    expect(validateAnswer(mockSurprise, '')).toBe(false);
  });
});
