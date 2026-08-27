export function accessState(profile) {
  if (!profile?.active) return "inactive";
  if (profile.status === "approved") return "authenticated";
  if (profile.status === "rejected") return "rejected";
  return "pending";
}
