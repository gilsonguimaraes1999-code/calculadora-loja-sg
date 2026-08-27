import type { City, Currency, RateQuote } from "@/lib/domain/types";

export type UserStatus = "pending" | "rejected" | "approved";
export type UserRole = "owner" | "admin" | "member";
export type PublicUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  approved: boolean;
  status: UserStatus;
  active: boolean;
};
export type AppConfig = { cities: City[] };
export type ManualUserInput = {
  name: string;
  email: string;
  password: string;
  role: "admin" | "member";
};
export type AuditItem = {
  timestamp: string;
  actorId: string;
  action: string;
  targetId: string;
  details: string;
};
export type Backend = {
  isDemo: boolean;
  sessionMode?: "custom" | "native";
  preload?(token: string, user: PublicUser): Promise<void>;
  register(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ status: UserStatus; message: string }>;
  login(
    email: string,
    password: string,
  ): Promise<{ token?: string; status: string; user: PublicUser }>;
  validateSession(token: string): Promise<PublicUser>;
  logout(token: string): Promise<void>;
  requestPasswordReset?(email: string, redirectTo: string): Promise<void>;
  updatePassword?(password: string): Promise<void>;
  getConfig(token: string): Promise<AppConfig>;
  getRates(
    token: string,
    pairs: Array<{ from: Currency; to: Currency }>,
    options?: { fresh?: boolean },
  ): Promise<RateQuote[]>;
  listUsers(token: string): Promise<PublicUser[]>;
  reviewUser(
    token: string,
    userId: string,
    reviewAction: "approve" | "reject",
  ): Promise<PublicUser>;
  updateUserRole(token: string, userId: string, role: "admin" | "member"): Promise<PublicUser>;
  saveUser(token: string, user: ManualUserInput): Promise<PublicUser>;
  deleteUser(token: string, userId: string): Promise<{ deleted: true }>;
  saveConfig(token: string, config: AppConfig): Promise<AppConfig>;
  getAuditLog(token: string): Promise<AuditItem[]>;
};
