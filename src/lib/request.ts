import type { Request } from "express";

export function bodyString(req: Request, key: string, fallback = ""): string {
  const value = req.body?.[key];
  return value === undefined || value === null ? fallback : String(value);
}

export function queryString(req: Request, key: string, fallback = ""): string {
  const value = req.query?.[key];
  return value === undefined || value === null ? fallback : String(value);
}

export function paramId(req: Request, key: string): number {
  return Number(req.params[key]);
}
