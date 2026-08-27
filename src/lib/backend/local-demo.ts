import { DEFAULT_CITIES } from "@/lib/domain/cities";
import { reviewButtons } from "@/lib/auth/guards";
import { assertUserCanBeDeleted, removeUserSessions } from "@/lib/auth/user-deletion.mjs";
import { normalizeCity } from "@/lib/domain/city-rules";
import type { AppConfig, AuditItem, Backend, PublicUser } from "./types";

type LocalUser = PublicUser & { password: string };
type State = {
  users: LocalUser[];
  config: AppConfig;
  sessions: Record<string, string>;
  audit: AuditItem[];
};
const KEY = "price-master:demo-backend:v1";

function initialState(): State {
  return {
    users: [
      {
        id: "owner-local",
        name: "Owner",
        email: "owner@local.test",
        password: "Owner@123",
        role: "owner",
        approved: true,
        status: "approved",
        active: true,
      },
    ],
    config: { cities: DEFAULT_CITIES },
    sessions: {},
    audit: [],
  };
}
function read(): State {
  try {
    const state = JSON.parse(localStorage.getItem(KEY) || "null") || initialState();
    state.users = (state.users || []).map((user: LocalUser & { role: string }) => ({
      ...user,
      role: user.role === "owner" || user.role === "admin" ? user.role : "member",
    }));
    state.config = { cities: (state.config?.cities || DEFAULT_CITIES).map(normalizeCity) };
    return state;
  } catch {
    return initialState();
  }
}
function write(state: State) {
  localStorage.setItem(KEY, JSON.stringify(state));
}
function publicUser(user: LocalUser): PublicUser {
  const { password: _password, ...safe } = user;
  return safe;
}
function auth(state: State, token: string) {
  const user = state.users.find((item) => item.id === state.sessions[token]);
  if (!user || !user.active || !user.approved) throw new Error("Sessão inválida.");
  return user;
}
function owner(state: State, token: string) {
  const user = auth(state, token);
  if (user.role !== "owner") throw new Error("Acesso exclusivo do owner.");
  return user;
}
function configurator(state: State, token: string) {
  const user = auth(state, token);
  if (user.role !== "owner" && user.role !== "admin")
    throw new Error("Acesso exclusivo de owner ou administrador.");
  return user;
}
function log(state: State, actorId: string, action: string, targetId: string) {
  state.audit.unshift({
    timestamp: new Date().toISOString(),
    actorId,
    action,
    targetId,
    details: "{}",
  });
}

export const localDemoBackend: Backend = {
  isDemo: true,
  sessionMode: "custom",
  async register(input) {
    const state = read();
    const email = input.email.trim().toLowerCase();
    if (state.users.some((u) => u.email === email))
      throw new Error("Já existe uma solicitação para este e-mail.");
    if (input.password.length < 8) throw new Error("A senha deve ter pelo menos 8 caracteres.");
    const user: LocalUser = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      email,
      password: input.password,
      role: "member",
      approved: false,
      status: "pending",
      active: true,
    };
    state.users.push(user);
    log(state, "public", "user.requested", user.id);
    write(state);
    return { status: "pending", message: "Solicitação enviada para aprovação." };
  },
  async login(email, password) {
    const state = read();
    const user = state.users.find(
      (u) => u.email === email.trim().toLowerCase() && u.password === password,
    );
    if (!user) throw new Error("E-mail ou senha inválidos.");
    if (!user.active) throw new Error("Acesso desativado.");
    if (!user.approved) return { status: user.status, user: publicUser(user) };
    const token = crypto.randomUUID();
    state.sessions[token] = user.id;
    write(state);
    return { token, status: "authenticated", user: publicUser(user) };
  },
  async validateSession(token) {
    return publicUser(auth(read(), token));
  },
  async logout(token) {
    const state = read();
    delete state.sessions[token];
    write(state);
  },
  async getConfig(token) {
    const state = read();
    auth(state, token);
    return state.config;
  },
  async getRates(token, pairs) {
    const state = read();
    auth(state, token);
    const currencies = Array.from(
      new Set(pairs.flatMap((pair) => [pair.from, pair.to]).filter((code) => code !== "BRL")),
    );
    const response = await fetch(
      `https://economia.awesomeapi.com.br/json/last/${currencies.map((code) => `${code}-BRL`).join(",")}`,
    );
    if (!response.ok) throw new Error("Cotação indisponível.");
    const payload = (await response.json()) as Record<string, { code: string; bid: string }>;
    const brlRates: Record<string, number> = { BRL: 1 };
    Object.values(payload).forEach((item) => {
      brlRates[item.code] = Number(item.bid);
    });
    const updatedAt = new Date().toISOString();
    return pairs.map((pair) => ({
      ...pair,
      rate: brlRates[pair.from] / brlRates[pair.to],
      source: "AwesomeAPI" as const,
      updatedAt,
    }));
  },
  async listUsers(token) {
    const state = read();
    owner(state, token);
    return state.users.map(publicUser);
  },
  async reviewUser(token, userId, reviewAction) {
    const state = read();
    const actor = owner(state, token);
    const user = state.users.find((u) => u.id === userId);
    if (!user) throw new Error("Usuário não encontrado.");
    const buttons = reviewButtons(user.status);
    if (!buttons[reviewAction === "approve" ? "approve" : "reject"])
      throw new Error("Ação já aplicada.");
    user.status = reviewAction === "approve" ? "approved" : "rejected";
    user.approved = reviewAction === "approve";
    if (!user.approved)
      Object.entries(state.sessions).forEach(([key, id]) => {
        if (id === user.id) delete state.sessions[key];
      });
    log(state, actor.id, `user.${user.status}`, user.id);
    write(state);
    return publicUser(user);
  },
  async updateUserRole(token, userId, role) {
    const state = read();
    const actor = owner(state, token);
    const user = state.users.find((item) => item.id === userId);
    if (!user) throw new Error("Usuário não encontrado.");
    if (user.role === "owner") throw new Error("A conta owner não pode ter sua função alterada.");
    if (!user.approved || user.status !== "approved")
      throw new Error("Aprove o usuário antes de definir sua função.");
    user.role = role;
    state.sessions = removeUserSessions(state.sessions, userId);
    log(state, actor.id, "user.role_changed", user.id);
    write(state);
    return publicUser(user);
  },
  async saveUser(token, input) {
    const state = read();
    const actor = owner(state, token);
    const email = input.email.trim().toLowerCase();
    if (state.users.some((user) => user.email === email)) throw new Error("E-mail já cadastrado.");
    if (input.name.trim().length < 2) throw new Error("Informe o nome do usuário.");
    if (input.password.length < 8) throw new Error("A senha deve ter pelo menos 8 caracteres.");
    const user: LocalUser = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      email,
      password: input.password,
      role: input.role,
      approved: true,
      status: "approved",
      active: true,
    };
    state.users.push(user);
    log(state, actor.id, "user.saved", user.id);
    write(state);
    return publicUser(user);
  },
  async deleteUser(token, userId) {
    const state = read();
    const actor = owner(state, token);
    const index = state.users.findIndex((user) => user.id === userId);
    const user = state.users[index];
    assertUserCanBeDeleted(user);
    state.sessions = removeUserSessions(state.sessions, userId);
    state.users.splice(index, 1);
    log(state, actor.id, "user.deleted", userId);
    write(state);
    return { deleted: true };
  },
  async saveConfig(token, config) {
    const state = read();
    const actor = configurator(state, token);
    state.config = {
      cities: config.cities.map((city) =>
        normalizeCity(city as unknown as Record<string, unknown>),
      ),
    };
    log(state, actor.id, "configuration.saved", "global");
    write(state);
    return state.config;
  },
  async getAuditLog(token) {
    const state = read();
    owner(state, token);
    return state.audit;
  },
};
