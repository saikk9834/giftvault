import {
  boolean,
  int,
  mediumtext,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Unique identifier — set to email for local auth users. */
  openId: varchar("openId", { length: 320 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Gifts ────────────────────────────────────────────────────────────────────

export const gifts = mysqlTable("gifts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  /** JSON array of base64 data URIs — stored as JSON string */
  photos: mediumtext("photos"),
  dateReceived: varchar("dateReceived", { length: 32 }).notNull(),
  occasion: mysqlEnum("occasion", [
    "birthday",
    "anniversary",
    "christmas",
    "wedding",
    "graduation",
    "valentines",
    "mothers_day",
    "fathers_day",
    "hanukkah",
    "other",
  ])
    .notNull()
    .default("other"),
  /** JSON array of tag strings */
  tags: varchar("tags", { length: 1024 }).notNull().default("[]"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Gift = typeof gifts.$inferSelect;
export type InsertGift = typeof gifts.$inferInsert;

// ─── Surprise Gifts ───────────────────────────────────────────────────────────

export const surprises = mysqlTable("surprises", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(),
  senderName: varchar("senderName", { length: 255 }).notNull(),
  senderAvatar: text("senderAvatar"),
  recipientId: int("recipientId").notNull(),
  recipientName: varchar("recipientName", { length: 255 }).notNull(),
  giftContent: text("giftContent").notNull(),
  giftImage: text("giftImage"),
  puzzle: text("puzzle").notNull(),
  puzzleImage: mediumtext("puzzleImage"),
  /** Stored lowercase for case-insensitive comparison */
  answer: varchar("answer", { length: 255 }).notNull(),
  deliveryDate: timestamp("deliveryDate").notNull(),
  isUnlocked: boolean("isUnlocked").notNull().default(false),
  unlockedAt: timestamp("unlockedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Surprise = typeof surprises.$inferSelect;
export type InsertSurprise = typeof surprises.$inferInsert;

// ─── Friends ──────────────────────────────────────────────────────────────────

export const friends = mysqlTable("friends", {
  id: int("id").autoincrement().primaryKey(),
  /** The user who initiated the friend request */
  requesterId: int("requesterId").notNull(),
  /** The user who received the friend request */
  addresseeId: int("addresseeId").notNull(),
  status: mysqlEnum("status", ["pending", "accepted"]).notNull().default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Friend = typeof friends.$inferSelect;
export type InsertFriend = typeof friends.$inferInsert;

// ─── Push Tokens ─────────────────────────────────────────────────────────────

export const pushTokens = mysqlTable('push_tokens', {
  id: int('id').autoincrement().primaryKey(),
  userId: int('userId').notNull(),
  token: varchar('token', { length: 512 }).notNull(),
  platform: varchar('platform', { length: 16 }).notNull().default('unknown'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().onUpdateNow().notNull(),
});

export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;
