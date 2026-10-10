import crypto from "node:crypto";

const TOKEN_BYTES = 32;

/** Issues a high-entropy opaque remember-me token. */
export function issueRememberToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashRememberToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
