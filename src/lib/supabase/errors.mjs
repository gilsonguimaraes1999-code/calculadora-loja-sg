export function friendlySupabaseError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  const code = String(error?.code || "");
  if (message.includes("invalid login credentials")) return "E-mail ou senha inválidos.";
  if (code === "42501" || message.includes("row-level security"))
    return "Você não tem permissão para realizar esta ação.";
  if (message.includes("fetch failed") || message.includes("failed to fetch"))
    return "Não foi possível conectar ao servidor. Tente novamente.";
  if (message.includes("user already registered") || code === "23505")
    return "Já existe uma conta ou solicitação para este e-mail.";
  if (message.includes("email rate limit"))
    return "Aguarde alguns minutos antes de solicitar outro e-mail.";
  return "Não foi possível concluir a operação. Tente novamente.";
}

export function throwFriendlySupabaseError(error) {
  throw new Error(friendlySupabaseError(error));
}
