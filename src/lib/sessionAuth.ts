import { clearRememberTokensForUser } from "../db.js";

/**
 * Invalidates durable auth state for a user after sensitive account changes
 * (for example role updates), so remembered logins cannot outlive the change.
 */
export function invalidateUserAuth(userId: number): void {
  clearRememberTokensForUser(userId);
}
