import { expireActiveReservations } from '../modules/inventory/inventory.service.js';

/** Periodically release expired checkout reservations (do not rely on TTL alone). */
export function startReservationExpiryJob(intervalMs = 60_000) {
  const tick = async () => {
    try {
      const n = await expireActiveReservations();
      if (n > 0) console.log(`[jobs] released ${n} expired reservation(s)`);
    } catch (err) {
      console.error('[jobs] reservation expiry failed', err);
    }
  };
  void tick();
  const id = setInterval(tick, intervalMs);
  id.unref?.();
  return () => clearInterval(id);
}
