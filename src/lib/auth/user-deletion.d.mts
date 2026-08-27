import type { UserRole } from "@/lib/backend/types";

export function assertUserCanBeDeleted(
  user: { id: string; role: UserRole } | undefined,
): void;

export function removeUserSessions(
  sessions: Record<string, string>,
  userId: string,
): Record<string, string>;
