import type { AuditItem, PublicUser } from "../backend/types";
import type { City } from "../domain/types";

export function cityFromRow(row: Record<string, unknown>): City;
export function cityToRow(city: City, position: number): {
  id: string;
  name: string;
  currency: string;
  discount: number;
  tebexMultiplier: number | null;
  position: number;
};
export function profileFromRow(row: Record<string, unknown>): PublicUser;
export function auditFromRow(row: Record<string, unknown>): AuditItem;
