/**
 * IndexedDB for auth (client-side only). Stores users with hashed passwords.
 */

const DB_NAME = "klyster-auth";
const DB_VERSION = 1;
const STORE_USERS = "users";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only available in the browser"));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_USERS)) {
        const store = db.createObjectStore(STORE_USERS, { keyPath: "id" });
        store.createIndex("email", "email", { unique: true });
      }
    };
  });
}

export async function addUser(record: Omit<UserRecord, "id" | "createdAt">): Promise<UserRecord> {
  const db = await openDB();
  const full: UserRecord = {
    ...record,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_USERS, "readwrite");
    const store = tx.objectStore(STORE_USERS);
    const req = store.add(full);
    req.onsuccess = () => {
      db.close();
      resolve(full);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_USERS, "readonly");
    const index = tx.objectStore(STORE_USERS).index("email");
    const req = index.get(email.toLowerCase().trim());
    req.onsuccess = () => {
      db.close();
      resolve((req.result as UserRecord) ?? null);
    };
    req.onerror = () => {
      db.close();
      reject(req.error);
    };
  });
}
