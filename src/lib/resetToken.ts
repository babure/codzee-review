export function createResetToken(userId: number): string {
  return `${userId}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}
