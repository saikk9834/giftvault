import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Gifts ────────────────────────────────────────────────────────────────────

import { gifts, friends, surprises } from "../drizzle/schema";
import type { InsertGift, InsertSurprise } from "../drizzle/schema";
import { and, desc, or } from "drizzle-orm";

export async function getUserGifts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(gifts).where(eq(gifts.userId, userId)).orderBy(desc(gifts.createdAt));
}

export async function getGiftById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(gifts).where(and(eq(gifts.id, id), eq(gifts.userId, userId))).limit(1);
  return rows[0] ?? null;
}

export async function createGift(data: InsertGift) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(gifts).values(data);
  return result[0].insertId as number;
}

export async function updateGift(id: number, userId: number, data: Partial<InsertGift>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(gifts).set({ ...data, updatedAt: new Date() }).where(and(eq(gifts.id, id), eq(gifts.userId, userId)));
}

export async function deleteGift(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(gifts).where(and(eq(gifts.id, id), eq(gifts.userId, userId)));
}

// ─── Surprises ────────────────────────────────────────────────────────────────

export async function getSurprisesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(surprises).where(
    or(eq(surprises.recipientId, userId), eq(surprises.senderId, userId))
  ).orderBy(desc(surprises.createdAt));
}

export async function getSurpriseById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(surprises).where(eq(surprises.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createSurprise(data: InsertSurprise) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const result = await db.insert(surprises).values(data);
  return result[0].insertId as number;
}

export async function unlockSurprise(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(surprises).set({ isUnlocked: true, unlockedAt: new Date() }).where(
    and(eq(surprises.id, id), eq(surprises.recipientId, userId))
  );
}

export async function deleteSurprise(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(surprises).where(
    and(eq(surprises.id, id), or(eq(surprises.senderId, userId), eq(surprises.recipientId, userId)))
  );
}

// ─── Friends ─────────────────────────────────────────────────────────────────

export async function getFriendsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(friends).where(
    or(eq(friends.requesterId, userId), eq(friends.addresseeId, userId))
  ).orderBy(desc(friends.createdAt));
}

export async function sendFriendRequest(requesterId: number, addresseeId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  // Check if already exists
  const existing = await db.select().from(friends).where(
    or(
      and(eq(friends.requesterId, requesterId), eq(friends.addresseeId, addresseeId)),
      and(eq(friends.requesterId, addresseeId), eq(friends.addresseeId, requesterId))
    )
  ).limit(1);
  if (existing.length > 0) throw new Error('Friend request already exists');
  const result = await db.insert(friends).values({ requesterId, addresseeId, status: 'pending' });
  return result[0].insertId as number;
}

export async function acceptFriendRequest(id: number, addresseeId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(friends).set({ status: 'accepted', updatedAt: new Date() }).where(
    and(eq(friends.id, id), eq(friends.addresseeId, addresseeId))
  );
}

export async function removeFriend(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(friends).where(
    and(eq(friends.id, id), or(eq(friends.requesterId, userId), eq(friends.addresseeId, userId)))
  );
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function searchUserByName(name: string, excludeUserId: number) {
  const db = await getDb();
  if (!db) return [];
  // Simple search: find users whose name contains the query (case-insensitive handled by DB)
  const allUsers = await db.select({ id: users.id, name: users.name, email: users.email }).from(users);
  return allUsers.filter(u => u.id !== excludeUserId && u.name?.toLowerCase().includes(name.toLowerCase()));
}
