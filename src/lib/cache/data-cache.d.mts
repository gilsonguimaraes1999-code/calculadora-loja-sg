export type CacheStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): unknown;
  removeItem(key: string): unknown;
};

export function createDataCache(options?: {
  storage?: CacheStorage | null;
  now?: () => number;
}): {
  read<T>(key: string, ttlMs: number): T | undefined;
  set<T>(key: string, value: T): T;
  load<T>(
    key: string,
    ttlMs: number,
    loader: () => Promise<T> | T,
    options?: { fresh?: boolean },
  ): Promise<T>;
  remove(key: string): void;
};

export const appDataCache: ReturnType<typeof createDataCache>;
