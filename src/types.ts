export type Role = "admin" | "editor" | "viewer";

export interface User {
  id: number;
  email: string;
  display_name: string;
  password_hash: string;
  role: Role;
  created_at: string;
}

export interface Note {
  id: number;
  user_id: number;
  title: string;
  body: string;
  created_at: string;
  author_name?: string;
}

export interface SessionUser {
  id: number;
  email: string;
  displayName: string;
  role: Role;
}

declare module "express-session" {
  interface SessionData {
    user?: SessionUser;
    flash?: {
      error?: string;
      success?: string;
    };
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
    }
  }
}

export {};
