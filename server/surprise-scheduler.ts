import * as db from "./db";
import { sendExpoPush } from "./push";

const POLL_INTERVAL_MS = 60_000;

async function dispatchPendingNotifications() {
  try {
    const pending = await db.getPendingSurpriseNotifications();
    for (const surprise of pending) {
      // Atomically claim this row — if another instance beats us, affected rows = 0
      await db.markSurpriseNotified(surprise.id);

      const tokens = await db.getPushTokensForUser(surprise.recipientId);
      if (tokens.length === 0) continue;

      await sendExpoPush({
        to: tokens,
        title: "🎁 You have a surprise!",
        body: `${surprise.senderName} sent you a surprise gift. Tap to reveal it!`,
        data: { url: `/surprise/${surprise.id}` },
        sound: "default",
        channelId: "surprises",
      });
    }
  } catch (err) {
    console.warn("[Scheduler] Failed to dispatch surprise notifications:", err);
  }
}

export function startSurpriseScheduler() {
  // Run once immediately on startup to catch anything missed while the server was down
  dispatchPendingNotifications();
  setInterval(dispatchPendingNotifications, POLL_INTERVAL_MS);
  console.log(
    "[Scheduler] Surprise notification scheduler started (60s interval)",
  );
}
