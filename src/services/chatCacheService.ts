/**
 * IndexedDB cache for chat messages.
 * Criteria 6: Caching dữ liệu offline với IndexedDB.
 */
import type { ChatMessage } from "@/types";

const DB_NAME = "news_chat_v1";
const DB_VERSION = 1;
const STORE = "messages";
const MAX_PER_GROUP = 100; // keep last N messages per group

let _db: IDBDatabase | null = null;
let _opening: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  if (_opening) return _opening;
  _opening = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "cacheKey" });
        store.createIndex("byGroup", "group_id");
      }
    };
    req.onsuccess = () => {
      _db = req.result;
      _db.onclose = () => {
        _db = null;
        _opening = null;
      };
      resolve(_db);
    };
    req.onerror = () => {
      _opening = null;
      reject(req.error);
    };
  });
  return _opening;
}

function tx(
  db: IDBDatabase,
  mode: IDBTransactionMode,
): [IDBObjectStore, Promise<void>] {
  const t = db.transaction(STORE, mode);
  const store = t.objectStore(STORE);
  const done = new Promise<void>((res, rej) => {
    t.oncomplete = () => res();
    t.onerror = () => rej(t.error);
  });
  return [store, done];
}

export const chatCacheService = {
  /** Persist the latest messages for a group (overwrites previous cache). */
  async saveMessages(groupId: number, messages: ChatMessage[]): Promise<void> {
    if (!messages.length) return;
    try {
      const db = await openDB();
      const [store, done] = tx(db, "readwrite");
      const idx = store.index("byGroup");

      // Delete old entries for this group
      const keysReq = idx.getAllKeys(IDBKeyRange.only(groupId));
      await new Promise<void>((res, rej) => {
        keysReq.onsuccess = () => {
          keysReq.result.forEach((k) => store.delete(k));
          res();
        };
        keysReq.onerror = () => rej(keysReq.error);
      });

      // Write the most recent MAX_PER_GROUP messages
      const toSave = messages.slice(-MAX_PER_GROUP);
      toSave.forEach((msg) =>
        store.put({ ...msg, group_id: groupId, cacheKey: `${groupId}_${msg.id}` }),
      );

      await done;
    } catch {
      // Cache failures are non-critical; silently skip
    }
  },

  /** Retrieve cached messages for a group, sorted oldest→newest. */
  async getMessages(groupId: number): Promise<ChatMessage[]> {
    try {
      const db = await openDB();
      const [store] = tx(db, "readonly");
      const req = store.index("byGroup").getAll(IDBKeyRange.only(groupId));
      const rows = await new Promise<(ChatMessage & { cacheKey: string; group_id: number })[]>(
        (res, rej) => {
          req.onsuccess = () => res(req.result ?? []);
          req.onerror = () => rej(req.error);
        },
      );
      return rows
        .map(({ cacheKey: _ck, group_id: _gid, ...m }) => m as ChatMessage)
        .sort((a, b) => a.created_at - b.created_at);
    } catch {
      return [];
    }
  },

  /** Append a single message (e.g. incoming live message) to the cache. */
  async appendMessage(groupId: number, message: ChatMessage): Promise<void> {
    try {
      const db = await openDB();
      const [store, done] = tx(db, "readwrite");
      store.put({ ...message, group_id: groupId, cacheKey: `${groupId}_${message.id}` });
      await done;
    } catch {
      // non-critical
    }
  },
};
