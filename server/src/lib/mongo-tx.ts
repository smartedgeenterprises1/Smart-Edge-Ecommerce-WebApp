import mongoose from 'mongoose';

/**
 * Runs work inside a MongoDB transaction when available (replica set / Atlas).
 * Falls back to non-transactional atomic updates on standalone MongoDB so local
 * development still works. Production should use a replica set.
 */
export async function withTransaction<T>(
  fn: (session: mongoose.ClientSession | null) => Promise<T>,
): Promise<T> {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    try {
      await session.abortTransaction();
    } catch {
      // ignore
    }
    const message = err instanceof Error ? err.message : String(err);
    const needsFallback =
      message.includes('replica set') ||
      message.includes('Transaction numbers') ||
      message.includes('transaction');
    if (!needsFallback) throw err;
    console.warn('[mongo] Transactions unavailable — falling back to non-transactional path. Use a replica set in production.');
    return fn(null);
  } finally {
    session.endSession();
  }
}
