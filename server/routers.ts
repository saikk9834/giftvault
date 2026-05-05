import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import * as db from "./db";
import { sendExpoPush } from "./push";

// ─── Shared Zod Schemas ───────────────────────────────────────────────────────

const occasionEnum = z.enum([
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
]);

// ─── Gifts Router ─────────────────────────────────────────────────────────────

const giftsRouter = router({
  list: protectedProcedure.query(({ ctx }) => db.getUserGifts(ctx.user.id)),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => db.getGiftById(input.id, ctx.user.id)),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        photos: z.array(z.string()).default([]),
        dateReceived: z.string(),
        occasion: occasionEnum.default("other"),
        tags: z.array(z.string()).default([]),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = await db.createGift({
        userId: ctx.user.id,
        title: input.title,
        photos: JSON.stringify(input.photos),
        dateReceived: input.dateReceived,
        occasion: input.occasion,
        tags: JSON.stringify(input.tags),
        notes: input.notes ?? null,
      });
      return { id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        photos: z.array(z.string()).optional(),
        dateReceived: z.string().optional(),
        occasion: occasionEnum.optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, photos, tags, ...rest } = input;
      await db.updateGift(id, ctx.user.id, {
        ...rest,
        ...(photos !== undefined ? { photos: JSON.stringify(photos) } : {}),
        ...(tags !== undefined ? { tags: JSON.stringify(tags) } : {}),
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteGift(input.id, ctx.user.id);
      return { success: true };
    }),

  uploadPhoto: protectedProcedure
    .input(
      z.object({
        base64: z.string(),
        mimeType: z.string().default("image/jpeg"),
        fileName: z.string().default("photo.jpg"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const key = `gifts/${ctx.user.id}/${input.fileName}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url };
    }),
});

// ─── Surprises Router ─────────────────────────────────────────────────────────

const surprisesRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    db.getSurprisesForUser(ctx.user.id),
  ),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const surprise = await db.getSurpriseById(input.id);
      if (!surprise) return null;
      // Only sender or recipient can view
      if (
        surprise.senderId !== ctx.user.id &&
        surprise.recipientId !== ctx.user.id
      )
        return null;
      // Hide the answer from the recipient until unlocked
      if (surprise.recipientId === ctx.user.id && !surprise.isUnlocked) {
        return { ...surprise, answer: "***" };
      }
      return surprise;
    }),

  send: protectedProcedure
    .input(
      z.object({
        recipientId: z.number(),
        recipientName: z.string(),
        giftContent: z.string().min(1),
        giftImage: z.string().optional(),
        puzzle: z.string().min(1),
        puzzleImage: z.string().optional(),
        answer: z.string().min(1),
        deliveryDate: z.string(), // ISO date string
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sender = await db.getUserById(ctx.user.id);
      const id = await db.createSurprise({
        senderId: ctx.user.id,
        senderName: sender?.name ?? "Anonymous",
        senderAvatar: null,
        recipientId: input.recipientId,
        recipientName: input.recipientName,
        giftContent: input.giftContent,
        giftImage: input.giftImage ?? null,
        puzzle: input.puzzle,
        puzzleImage: input.puzzleImage ?? null,
        answer: input.answer.toLowerCase().trim(),
        deliveryDate: new Date(input.deliveryDate),
        isUnlocked: false,
      });
      // Send push notification to recipient if the gift is already available
      const deliveryDate = new Date(input.deliveryDate);
      const isAvailableNow = deliveryDate <= new Date();
      if (isAvailableNow) {
        await db.markSurpriseNotified(id);
        const tokens = await db.getPushTokensForUser(input.recipientId);
        if (tokens.length > 0) {
          await sendExpoPush({
            to: tokens,
            title: "\uD83C\uDF81 You have a surprise!",
            body: `${sender?.name ?? "Someone"} sent you a surprise gift. Tap to reveal it!`,
            data: { url: `/surprise/${id}` },
            sound: "default",
            channelId: "surprises",
          });
        }
      }

      return { id };
    }),

  unlock: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        answer: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const surprise = await db.getSurpriseById(input.id);
      if (!surprise) throw new Error("Surprise not found");
      if (surprise.recipientId !== ctx.user.id)
        throw new Error("Not authorized");
      if (surprise.isUnlocked) return { success: true, alreadyUnlocked: true };

      const correct = surprise.answer === input.answer.toLowerCase().trim();
      if (!correct) return { success: false, correct: false };

      await db.unlockSurprise(input.id, ctx.user.id);
      return { success: true, correct: true };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        giftContent: z.string().min(1).optional(),
        puzzle: z.string().min(1).optional(),
        puzzleImage: z.string().nullable().optional(),
        answer: z.string().min(1).optional(),
        deliveryDate: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const surprise = await db.getSurpriseById(input.id);
      if (!surprise) throw new Error("Surprise not found");
      if (surprise.senderId !== ctx.user.id) throw new Error("Not authorized");
      if (surprise.isUnlocked)
        throw new Error("Cannot edit an already-unlocked surprise");
      const updateData: Record<string, unknown> = {};
      if (input.giftContent !== undefined)
        updateData.giftContent = input.giftContent;
      if (input.puzzle !== undefined) updateData.puzzle = input.puzzle;
      if (input.puzzleImage !== undefined)
        updateData.puzzleImage = input.puzzleImage;
      if (input.answer !== undefined)
        updateData.answer = input.answer.toLowerCase().trim();
      if (input.deliveryDate !== undefined)
        updateData.deliveryDate = new Date(input.deliveryDate);
      await db.updateSurprise(input.id, ctx.user.id, updateData);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteSurprise(input.id, ctx.user.id);
      return { success: true };
    }),
});

// ─── Friends Router ───────────────────────────────────────────────────────────

const friendsRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    db.getFriendsForUser(ctx.user.id),
  ),

  search: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(({ ctx, input }) => db.searchUserByName(input.query, ctx.user.id)),

  sendRequest: protectedProcedure
    .input(z.object({ addresseeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.sendFriendRequest(ctx.user.id, input.addresseeId);
      return { id };
    }),

  accept: protectedProcedure
    .input(z.object({ friendId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.acceptFriendRequest(input.friendId, ctx.user.id);
      return { success: true };
    }),

  remove: protectedProcedure
    .input(z.object({ friendId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.removeFriend(input.friendId, ctx.user.id);
      return { success: true };
    }),
});

// ─── Notifications Router ────────────────────────────────────────────────────

const notificationsRouter = router({
  /** Register or refresh the device's Expo push token for the current user. */
  registerToken: protectedProcedure
    .input(
      z.object({
        token: z.string().min(1),
        platform: z.enum(["ios", "android", "web"]).default("android"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await db.upsertPushToken(ctx.user.id, input.token, input.platform);
      return { success: true };
    }),

  /** Remove a push token on logout so the device no longer receives notifications. */
  removeToken: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.removePushToken(ctx.user.id, input.token);
      return { success: true };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  gifts: giftsRouter,
  surprises: surprisesRouter,
  friends: friendsRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
