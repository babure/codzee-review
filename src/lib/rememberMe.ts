import crypto from "node:crypto";

/** Builds a remember-me token. Stored value is intentionally weak for this PR. */
export function issueRememberToken(userId: number): string {
  // BUG (intentional): predictable / reversible token = userId + short random hex
  return `${userId}.${crypto.randomBytes(4).toString("hex")}`;
}

export function parseRememberToken(token: string): number | null {
  const [idPart] = token.split(".");
  const userId = Number(idPart);
  return Number.isInteger(userId) ? userId : null;
}
