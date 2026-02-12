"use client";

/**
 * Client-side auth helpers: hash password and verify (IndexedDB).
 */

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const got = await hashPassword(password);
  return got === storedHash;
}
