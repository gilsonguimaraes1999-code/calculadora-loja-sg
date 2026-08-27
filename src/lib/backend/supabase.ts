import type { Backend, PublicUser } from "./types";
import { accessState } from "@/lib/auth/auth-state.mjs";
import { getSupabaseClient } from "@/lib/supabase/client";
import { auditFromRow, cityFromRow, cityToRow, profileFromRow } from "@/lib/supabase/mappers.mjs";
import { throwFriendlySupabaseError } from "@/lib/supabase/errors.mjs";
import { appDataCache } from "@/lib/cache/data-cache.mjs";

const CONFIG_TTL = 5 * 60 * 1000;
const USERS_TTL = 60 * 1000;
const AUDIT_TTL = 60 * 1000;
const RATES_TTL = 5 * 60 * 1000;
let activeUserId = "anonymous";
const cacheKey = (name: string) => `${activeUserId}:${name}`;

async function currentProfile(): Promise<PublicUser> {
  const client = getSupabaseClient();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError || !authData.user) throw new Error("Sessão expirada.");
  const { data, error } = await client
    .from("profiles")
    .select("id,name,email,role,status,active")
    .eq("id", authData.user.id)
    .single();
  if (error || !data) throwFriendlySupabaseError(error);
  activeUserId = String(data.id);
  return profileFromRow(data as Record<string, unknown>);
}

async function functionCall<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabaseClient().functions.invoke(name, { body });
  if (error) throwFriendlySupabaseError(error);
  return data as T;
}

export const supabaseBackend: Backend = {
  isDemo: false,
  sessionMode: "native",
  async preload(token, user) {
    const tasks: Array<Promise<unknown>> = [
      supabaseBackend.getConfig(token),
      supabaseBackend.getRates(token, [
        { from: "BRL", to: "USD" },
        { from: "GBP", to: "BRL" },
        { from: "EUR", to: "BRL" },
      ]),
    ];
    if (user.role === "owner") {
      tasks.push(supabaseBackend.listUsers(token), supabaseBackend.getAuditLog(token));
    }
    await Promise.all(tasks);
  },
  async register(input) {
    const client = getSupabaseClient();
    const { error } = await client.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: { data: { name: input.name.trim() } },
    });
    if (error) throwFriendlySupabaseError(error);
    await client.auth.signOut();
    return { status: "pending", message: "Solicitação enviada para aprovação." };
  },
  async login(email, password) {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error || !data.session) throwFriendlySupabaseError(error);
    const user = await currentProfile();
    const status = accessState(user);
    if (status !== "authenticated") {
      await client.auth.signOut();
      return { status, user };
    }
    return { token: "supabase-session", status, user };
  },
  async validateSession() {
    return currentProfile();
  },
  async logout() {
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) throwFriendlySupabaseError(error);
    activeUserId = "anonymous";
  },
  async requestPasswordReset(email, redirectTo) {
    const { error } = await getSupabaseClient().auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo },
    );
    if (error) throwFriendlySupabaseError(error);
  },
  async updatePassword(password) {
    const { error } = await getSupabaseClient().auth.updateUser({ password });
    if (error) throwFriendlySupabaseError(error);
  },
  async getConfig() {
    return appDataCache.load(cacheKey("config"), CONFIG_TTL, async () => {
      const { data, error } = await getSupabaseClient()
        .from("cities")
        .select("id,name,currency,discount,tebex_multiplier,position")
        .order("position");
      if (error) throwFriendlySupabaseError(error);
      return { cities: (data || []).map((row) => cityFromRow(row as Record<string, unknown>)) };
    });
  },
  async getRates(_token, pairs, options) {
    const signature = pairs
      .map(({ from, to }) => `${from}-${to}`)
      .sort()
      .join("|");
    return appDataCache.load(
      cacheKey(`rates:${signature}`),
      RATES_TTL,
      () => functionCall("awesome-rates", { pairs }),
      options,
    );
  },
  async listUsers() {
    return appDataCache.load(cacheKey("users"), USERS_TTL, async () => {
      const { data, error } = await getSupabaseClient()
        .from("profiles")
        .select("id,name,email,role,status,active")
        .order("created_at");
      if (error) throwFriendlySupabaseError(error);
      return (data || []).map((row) => profileFromRow(row as Record<string, unknown>));
    });
  },
  async reviewUser(_token, userId, reviewAction) {
    const { data, error } = await getSupabaseClient()
      .rpc("review_user", { target_user_id: userId, review_action: reviewAction })
      .single();
    if (error || !data) throwFriendlySupabaseError(error);
    appDataCache.remove(cacheKey("users"));
    appDataCache.remove(cacheKey("audit"));
    return profileFromRow(data as Record<string, unknown>);
  },
  async updateUserRole(_token, userId, role) {
    const { data, error } = await getSupabaseClient()
      .rpc("change_user_role", { target_user_id: userId, next_role: role })
      .single();
    if (error || !data) throwFriendlySupabaseError(error);
    appDataCache.remove(cacheKey("users"));
    appDataCache.remove(cacheKey("audit"));
    return profileFromRow(data as Record<string, unknown>);
  },
  async saveUser(_token, user) {
    const saved = await functionCall<PublicUser>("admin-users", { action: "create", ...user });
    appDataCache.remove(cacheKey("users"));
    appDataCache.remove(cacheKey("audit"));
    return saved;
  },
  async deleteUser(_token, userId) {
    const result = await functionCall<{ deleted: true }>("admin-users", {
      action: "delete",
      userId,
    });
    appDataCache.remove(cacheKey("users"));
    appDataCache.remove(cacheKey("audit"));
    return result;
  },
  async saveConfig(_token, config) {
    const cityItems = config.cities.map(cityToRow);
    const { data, error } = await getSupabaseClient().rpc("save_cities", {
      city_items: cityItems,
    });
    if (error) throwFriendlySupabaseError(error);
    const saved = {
      cities: (data || []).map((row) => cityFromRow(row as Record<string, unknown>)),
    };
    appDataCache.set(cacheKey("config"), saved);
    appDataCache.remove(cacheKey("audit"));
    return saved;
  },
  async getAuditLog() {
    return appDataCache.load(cacheKey("audit"), AUDIT_TTL, async () => {
      const { data, error } = await getSupabaseClient()
        .from("audit_logs")
        .select("created_at,actor_id,action,target_id,details")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throwFriendlySupabaseError(error);
      return (data || []).map((row) => auditFromRow(row as Record<string, unknown>));
    });
  },
};
