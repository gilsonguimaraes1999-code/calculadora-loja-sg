import { corsHeaders, json } from "../_shared/cors.ts";
import { authenticatedProfile } from "../_shared/auth.ts";
import { assertOwnerAction } from "./domain.mjs";

type CreateBody = {
  action: "create";
  name: string;
  email: string;
  password: string;
  role: "admin" | "member";
};
type DeleteBody = { action: "delete"; userId: string };

function createInput(body: CreateBody) {
  const name = String(body.name || "").trim();
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const password = String(body.password || "");
  const role = body.role === "admin" ? "admin" : "member";
  if (name.length < 2) throw new Error("Informe o nome do usuário.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Informe um e-mail válido.");
  if (password.length < 8) throw new Error("A senha deve ter pelo menos 8 caracteres.");
  return { name, email, password, role };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);
  try {
    const body = (await request.json()) as CreateBody | DeleteBody;
    const { admin, profile } = await authenticatedProfile(request);

    if (body.action === "create") {
      assertOwnerAction({ caller: profile, action: "create" });
      const input = createInput(body);
      const { data, error } = await admin.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: { name: input.name },
      });
      if (error || !data.user) throw error || new Error("Usuário não foi criado.");
      const { data: saved, error: profileError } = await admin
        .from("profiles")
        .update({
          name: input.name,
          role: input.role,
          status: "approved",
          active: true,
          reviewed_at: new Date().toISOString(),
          reviewed_by: profile.id,
        })
        .eq("id", data.user.id)
        .select("id,name,email,role,status,active")
        .single();
      if (profileError || !saved) {
        await admin.auth.admin.deleteUser(data.user.id);
        throw profileError || new Error("Perfil não foi criado.");
      }
      await admin.from("audit_logs").insert({
        actor_id: profile.id,
        action: "user.saved",
        target_type: "user",
        target_id: data.user.id,
      });
      return json({ ...saved, approved: true });
    }

    if (body.action === "delete") {
      const { data: target, error: targetError } = await admin
        .from("profiles")
        .select("id,role")
        .eq("id", body.userId)
        .single();
      if (targetError || !target) throw new Error("Usuário não encontrado.");
      assertOwnerAction({ caller: profile, action: "delete", target });
      await admin.from("audit_logs").insert({
        actor_id: profile.id,
        action: "user.deleted",
        target_type: "user",
        target_id: body.userId,
      });
      const { error } = await admin.auth.admin.deleteUser(body.userId);
      if (error) throw error;
      return json({ deleted: true });
    }

    return json({ error: "Ação inválida." }, 400);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível concluir a operação.";
    const status = /owner|permissão|sessão/i.test(message) ? 403 : 400;
    return json({ error: message }, status);
  }
});
