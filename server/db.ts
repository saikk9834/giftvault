import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      const isRemote = !["localhost", "127.0.0.1", "::1"].includes(
        url.hostname,
      );
      const pool = mysql.createPool({
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace(/^\//, ""),
        ssl: isRemote ? { rejectUnauthorized: true } : undefined,
        waitForConnections: true,
        connectionLimit: 10,
      });
      _db = drizzle(pool);
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

export async function createLocalUser(data: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(users).values({
    openId: data.email,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    loginMethod: "email",
    lastSignedIn: new Date(),
  });
  return result[0].insertId as number;
}

export async function updateUserLastSignedIn(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(users)
    .set({ lastSignedIn: new Date() })
    .where(eq(users.id, userId));
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Gifts ────────────────────────────────────────────────────────────────────

import { gifts, friends, surprises, pushTokens } from "../drizzle/schema";
import type { InsertGift, InsertSurprise } from "../drizzle/schema";
import { and, desc, isNull, lte, or } from "drizzle-orm";

export async function getUserGifts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(gifts)
    .where(eq(gifts.userId, userId))
    .orderBy(desc(gifts.createdAt));
}

export async function getGiftById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(gifts)
    .where(and(eq(gifts.id, id), eq(gifts.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createGift(data: InsertGift) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(gifts).values(data);
  return result[0].insertId as number;
}

export async function updateGift(
  id: number,
  userId: number,
  data: Partial<InsertGift>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(gifts)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(gifts.id, id), eq(gifts.userId, userId)));
}

export async function deleteGift(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(gifts).where(and(eq(gifts.id, id), eq(gifts.userId, userId)));
}

// ─── Surprises ────────────────────────────────────────────────────────────────

export async function getSurprisesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(surprises)
    .where(
      or(eq(surprises.recipientId, userId), eq(surprises.senderId, userId)),
    )
    .orderBy(desc(surprises.createdAt));
}

export async function getSurpriseById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(surprises)
    .where(eq(surprises.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createSurprise(data: InsertSurprise) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(surprises).values(data);
  return result[0].insertId as number;
}

export async function unlockSurprise(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(surprises)
    .set({ isUnlocked: true, unlockedAt: new Date() })
    .where(and(eq(surprises.id, id), eq(surprises.recipientId, userId)));
}

export async function updateSurprise(
  id: number,
  senderId: number,
  data: Partial<InsertSurprise>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(surprises)
    .set(data)
    .where(and(eq(surprises.id, id), eq(surprises.senderId, senderId)));
}

export async function deleteSurprise(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(surprises)
    .where(
      and(
        eq(surprises.id, id),
        or(eq(surprises.senderId, userId), eq(surprises.recipientId, userId)),
      ),
    );
}

export async function getPendingSurpriseNotifications() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(surprises)
    .where(
      and(
        lte(surprises.deliveryDate, new Date()),
        isNull(surprises.notifiedAt),
      ),
    );
}

export async function markSurpriseNotified(id: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(surprises)
    .set({ notifiedAt: new Date() })
    .where(and(eq(surprises.id, id), isNull(surprises.notifiedAt)));
}

// ─── Friends ─────────────────────────────────────────────────────────────────

export async function getFriendsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Alias users table twice so we can join both requester and addressee names
  const requesterAlias = { id: users.id, name: users.name, email: users.email };

  const rows = await db
    .select({
      id: friends.id,
      requesterId: friends.requesterId,
      addresseeId: friends.addresseeId,
      status: friends.status,
      createdAt: friends.createdAt,
      updatedAt: friends.updatedAt,
    })
    .from(friends)
    .where(or(eq(friends.requesterId, userId), eq(friends.addresseeId, userId)))
    .orderBy(desc(friends.createdAt));

  if (rows.length === 0) return [];

  // Collect all unique other-user IDs
  const otherIds = [
    ...new Set(
      rows.map((r) =>
        r.requesterId === userId ? r.addresseeId : r.requesterId,
      ),
    ),
  ];

  // Fetch their user records in one query
  const otherUsers = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(or(...otherIds.map((id) => eq(users.id, id))));

  const userMap = new Map(otherUsers.map((u) => [u.id, u]));

  return rows.map((r) => {
    const otherId = r.requesterId === userId ? r.addresseeId : r.requesterId;
    const other = userMap.get(otherId);
    const displayName =
      other?.name ?? other?.email?.split("@")[0] ?? `User ${otherId}`;
    return { ...r, otherUserId: otherId, otherName: displayName };
  });
}

export async function sendFriendRequest(
  requesterId: number,
  addresseeId: number,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Check if already exists
  const existing = await db
    .select()
    .from(friends)
    .where(
      or(
        and(
          eq(friends.requesterId, requesterId),
          eq(friends.addresseeId, addresseeId),
        ),
        and(
          eq(friends.requesterId, addresseeId),
          eq(friends.addresseeId, requesterId),
        ),
      ),
    )
    .limit(1);
  if (existing.length > 0) throw new Error("Friend request already exists");
  const result = await db
    .insert(friends)
    .values({ requesterId, addresseeId, status: "pending" });
  return result[0].insertId as number;
}

export async function acceptFriendRequest(id: number, addresseeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(friends)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(and(eq(friends.id, id), eq(friends.addresseeId, addresseeId)));
}

export async function removeFriend(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(friends)
    .where(
      and(
        eq(friends.id, id),
        or(eq(friends.requesterId, userId), eq(friends.addresseeId, userId)),
      ),
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
  const q = name.toLowerCase().replace(/\s+/g, "");
  const allUsers = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users);
  return allUsers.filter((u) => {
    if (u.id === excludeUserId) return false;
    const nameMatch = u.name?.toLowerCase().replace(/\s+/g, "").includes(q);
    const emailMatch = u.email?.toLowerCase().includes(q);
    return nameMatch || emailMatch;
  });
}

// ─── Push Tokens ─────────────────────────────────────────────────────────────

/**
 * Upsert a push token for a user. If the token already exists for this user,
 * update the platform and timestamp. Otherwise insert a new row.
 */
export async function upsertPushToken(
  userId: number,
  token: string,
  platform: string,
) {
  const db = await getDb();
  if (!db) return;

  // Check if this exact token already exists for this user
  const existing = await db
    .select({ id: pushTokens.id })
    .from(pushTokens)
    .where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)))
    .limit(1);

  if (existing.length > 0) {
    // Touch updatedAt so we know it's still active
    await db
      .update(pushTokens)
      .set({ platform, updatedAt: new Date() })
      .where(eq(pushTokens.id, existing[0].id));
  } else {
    await db.insert(pushTokens).values({ userId, token, platform });
  }
}

/**
 * Get all push tokens for a given user ID.
 */
export async function getPushTokensForUser(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ token: pushTokens.token })
    .from(pushTokens)
    .where(eq(pushTokens.userId, userId));
  return rows.map((r) => r.token);
}

/**
 * Remove a push token (e.g. when user logs out or token is invalidated).
 */
export async function removePushToken(userId: number, token: string) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(pushTokens)
    .where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)));
}
