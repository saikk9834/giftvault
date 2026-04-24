import { addGift } from './gift-store';
import { addSurprise } from './surprise-store';
import { seedDemoFriends } from './friends-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SEEDED_KEY = '@giftvault:seeded';

export async function seedDemoData(): Promise<void> {
  const seeded = await AsyncStorage.getItem(SEEDED_KEY);
  if (seeded) return;

  // Seed friends first
  await seedDemoFriends();

  // Seed demo gifts
  const demoGifts = [
    {
      title: 'Rose Gold Watch',
      photos: [],
      dateReceived: '2025-12-25',
      occasion: 'christmas' as const,
      tags: ['jewelry', 'luxury'],
      notes: 'Beautiful rose gold watch from Mom. Engraved with my initials.',
    },
    {
      title: 'Leather Journal',
      photos: [],
      dateReceived: '2025-10-15',
      occasion: 'birthday' as const,
      tags: ['stationery', 'handmade'],
      notes: 'Hand-stitched leather journal with my name embossed on the cover.',
    },
    {
      title: 'Wireless Earbuds',
      photos: [],
      dateReceived: '2026-02-14',
      occasion: 'valentines' as const,
      tags: ['tech', 'audio'],
      notes: 'Premium noise-cancelling earbuds. Perfect for commuting.',
    },
    {
      title: 'Silk Scarf',
      photos: [],
      dateReceived: '2025-05-12',
      occasion: 'mothers_day' as const,
      tags: ['fashion', 'accessories'],
    },
    {
      title: 'Gourmet Chocolate Box',
      photos: [],
      dateReceived: '2025-03-20',
      occasion: 'other' as const,
      tags: ['food', 'sweet'],
      notes: 'Artisan Belgian chocolates assortment.',
    },
    {
      title: 'Vintage Vinyl Record',
      photos: [],
      dateReceived: '2025-08-01',
      occasion: 'birthday' as const,
      tags: ['music', 'vintage', 'collectible'],
      notes: 'Original 1970s pressing. Incredible find!',
    },
  ];

  for (const gift of demoGifts) {
    await addGift(gift);
  }

  // Seed a demo surprise gift (incoming, locked)
  await addSurprise({
    senderId: 'friend_demo_1',
    senderName: 'Alex Johnson',
    recipientId: 'me',
    recipientName: 'Gift Lover',
    giftContent: 'A special surprise just for you! Something you have been wanting for a long time.',
    puzzle: 'I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. What am I?',
    answer: 'map',
    deliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // Seed a demo surprise gift (incoming, delivery soon)
  await addSurprise({
    senderId: 'friend_demo_2',
    senderName: 'Sam Williams',
    recipientId: 'me',
    recipientName: 'Gift Lover',
    giftContent: 'Happy birthday! Hope this makes your day extra special.',
    puzzle: 'The more you take, the more you leave behind. What am I?',
    answer: 'footsteps',
    deliveryDate: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago — available now
  });

  await AsyncStorage.setItem(SEEDED_KEY, 'true');
}
