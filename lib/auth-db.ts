/**
 * IndexedDB storage for user signup/login (client-side only).
 * Passwords are hashed with SHA-256 before storing.
 */

const DB_NAME = "klyster-auth";
const DB_VERSION = 1;
const STORE_USERS = "users";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_USERS)) {
        db.createObjectStore(STORE_USERS, { keyPath: "email" });
      }
    };
  });
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export interface StoredUser {
  email: string;
  passwordHash: string;
  createdAt: string;
}

export async function signUp(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !password) {
    return { ok: false, error: "Email and password are required" };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters" };
  }
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_USERS, "readwrite");
    const store = tx.objectStore(STORE_USERS);
    const getReq = store.get(trimmed);
    getReq.onsuccess = () => {
      if (getReq.result) {
        db.close();
        return resolve({ ok: false, error: "An account with this email already exists" });
      }
      hashPassword(password).then((passwordHash) => {
        const user: StoredUser = {
          email: trimmed,
          passwordHash,
          createdAt: new Date().toISOString(),
        };
        store.put(user);
        tx.oncomplete = () => {
          db.close();
          resolve({ ok: true });
        };
        tx.onerror = () => {
          db.close();
          resolve({ ok: false, error: "Failed to create account" });
        };
      });
    };
  });
}

export async function signIn(email: string, password: string): Promise<{ ok: boolean; user?: string; error?: string }> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !password) {
    return { ok: false, error: "Email and password are required" };
  }
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_USERS, "readonly");
    const store = tx.objectStore(STORE_USERS);
    const req = store.get(trimmed);
    req.onsuccess = async () => {
      const user = req.result as StoredUser | undefined;
      db.close();
      if (!user) {
        return resolve({ ok: false, error: "No account found with this email" });
      }
      const passwordHash = await hashPassword(password);
      if (passwordHash !== user.passwordHash) {
        return resolve({ ok: false, error: "Incorrect password" });
      }
      resolve({ ok: true, user: user.email });
    };
    req.onerror = () => {
      db.close();
      resolve({ ok: false, error: "Login failed" });
    };
  });
}
