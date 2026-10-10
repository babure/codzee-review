import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hashPassword } from "./lib/password.js";
import type { Note, Role, User } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "app.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function migrate(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS remember_tokens (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const admin = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get("admin@example.com") as { id: number } | undefined;

  if (!admin) {
    const passwordHash = hashPassword("Admin123!");
    db.prepare(
      `INSERT INTO users (email, display_name, password_hash, role)
       VALUES (?, ?, ?, ?)`,
    ).run("admin@example.com", "Site Admin", passwordHash, "admin");
  }
}

export function findUserByEmail(email: string): User | undefined {
  return db
    .prepare("SELECT * FROM users WHERE email = ? COLLATE NOCASE")
    .get(email) as User | undefined;
}

export function findUserById(id: number): User | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | User
    | undefined;
}

export function createUser(
  email: string,
  displayName: string,
  passwordHash: string,
  role: Role = "viewer",
): User {
  const result = db
    .prepare(
      `INSERT INTO users (email, display_name, password_hash, role)
       VALUES (?, ?, ?, ?)`,
    )
    .run(email, displayName, passwordHash, role);

  const user = findUserById(Number(result.lastInsertRowid));
  if (!user) {
    throw new Error("Failed to create user");
  }
  return user;
}

export function listUsers(): User[] {
  return db
    .prepare("SELECT * FROM users ORDER BY created_at ASC")
    .all() as User[];
}

export function updateUserRole(userId: number, role: Role): void {
  db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, userId);
}

export function listNotes(): Note[] {
  return db
    .prepare(
      `SELECT notes.*, users.display_name AS author_name
       FROM notes
       JOIN users ON users.id = notes.user_id
       ORDER BY notes.created_at DESC`,
    )
    .all() as Note[];
}

export function createNote(userId: number, title: string, body: string): Note {
  const result = db
    .prepare("INSERT INTO notes (user_id, title, body) VALUES (?, ?, ?)")
    .run(userId, title, body);

  const note = db
    .prepare(
      `SELECT notes.*, users.display_name AS author_name
       FROM notes
       JOIN users ON users.id = notes.user_id
       WHERE notes.id = ?`,
    )
    .get(result.lastInsertRowid) as Note | undefined;

  if (!note) {
    throw new Error("Failed to create note");
  }
  return note;
}

export function findNoteById(id: number): Note | undefined {
  return db
    .prepare(
      `SELECT notes.*, users.display_name AS author_name
       FROM notes
       JOIN users ON users.id = notes.user_id
       WHERE notes.id = ?`,
    )
    .get(id) as Note | undefined;
}

export function deleteNote(id: number): void {
  db.prepare("DELETE FROM notes WHERE id = ?").run(id);
}

export function saveRememberToken(token: string, userId: number): void {
  db.prepare(
    "INSERT OR REPLACE INTO remember_tokens (token, user_id) VALUES (?, ?)",
  ).run(token, userId);
}

export function findUserIdByRememberToken(token: string): number | undefined {
  const row = db
    .prepare("SELECT user_id FROM remember_tokens WHERE token = ?")
    .get(token) as { user_id: number } | undefined;
  return row?.user_id;
}

export function clearRememberTokensForUser(userId: number): void {
  db.prepare("DELETE FROM remember_tokens WHERE user_id = ?").run(userId);
}
