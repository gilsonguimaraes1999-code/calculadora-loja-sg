export function accessState(profile: {
  status: "pending" | "rejected" | "approved";
  active: boolean;
} | null): "authenticated" | "pending" | "rejected" | "inactive";
