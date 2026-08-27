type GuardUser = { role: string; approved: boolean; status: string; active: boolean };

const VECTOR_BACKGROUND_ROUTES = new Set([
  "/dashboard",
  "/configuracao",
  "/usuarios",
  "/usuarios/novo",
]);

export function usesVectorBackground(pathname: string) {
  return VECTOR_BACKGROUND_ROUTES.has(pathname);
}

export function canAccessRoute(user: GuardUser | null, pathname: string) {
  if (pathname === "/login") return true;
  if (!user || !user.active || !user.approved || user.status !== "approved") return false;
  if (pathname === "/usuarios" || pathname.startsWith("/usuarios/")) return user.role === "owner";
  if (pathname === "/configuracao") return user.role === "owner" || user.role === "admin";
  return pathname === "/dashboard" || pathname === "/";
}

export function reviewButtons(status: string, role = "user") {
  if (role === "owner") return { approve: false, reject: false };
  return { approve: status !== "approved", reject: status !== "rejected" };
}
