import type { Lock, LockStore } from './store.ts';

export async function releaseLock(store: LockStore, lock: Lock): Promise<void> {
  if (await store.get(lock.key) === lock.token) {
    await store.delete(lock.key);
  }
}
