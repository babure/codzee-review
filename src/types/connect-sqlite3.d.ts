declare module "connect-sqlite3" {
  import type session from "express-session";

  interface SQLiteStoreOptions {
    db?: string;
    dir?: string;
    table?: string;
  }

  interface SQLiteStore {
    new (options?: SQLiteStoreOptions): session.Store;
  }

  export default function connectSqlite3(
    sessionModule: typeof session,
  ): SQLiteStore;
}
