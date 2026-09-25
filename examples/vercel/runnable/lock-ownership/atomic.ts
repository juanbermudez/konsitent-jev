import type { Lock, LockStore } from './store.ts';

export async function releaseLock(store: LockStore, lock: Lock): Promise<void> {
  await store.compareAndDelete(lock.key, lock.token);
}
