export type Lock = { key: string; token: string };
export interface LockStore {
  get(key: string): Promise<string | undefined>;
  delete(key: string): Promise<void>;
  compareAndDelete(key: string, expectedToken: string): Promise<boolean>;
}

// Deterministic scheduling model, not a Redis implementation.
// Each store command is atomic; ownership can change between commands.
export function createStore(initialToken: string) {
  const entries = new Map([['thread:42', initialToken]]);
  let replaced = false;
  let replaceAfterRead: string | undefined;
  return {
    replaceOwnerAfterNextRead(token: string) { replaceAfterRead = token; },
    ownershipChanged() { return replaced; },
    currentOwner() { return entries.get('thread:42'); },
    async get(key: string) {
      const value = entries.get(key);
      if (replaceAfterRead !== undefined) {
        entries.set(key, replaceAfterRead);
        replaced = true;
        replaceAfterRead = undefined;
      }
      return value;
    },
    async delete(key: string) { entries.delete(key); },
    async compareAndDelete(key: string, token: string) {
      if (entries.get(key) !== token) return false;
      entries.delete(key);
      return true;
    },
  };
}
