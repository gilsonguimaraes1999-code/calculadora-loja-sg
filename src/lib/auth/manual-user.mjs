export function validateManualUser(input) {
  const name = String(input.name || "").trim();
  const email = String(input.email || "")
    .trim()
    .toLowerCase();
  const password = String(input.password || "");
  const passwordConfirmation = String(input.passwordConfirmation || "");

  if (name.length < 2) throw new Error("Informe o nome do usuário.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Informe um e-mail válido.");
  if (password.length < 8) throw new Error("A senha deve ter pelo menos 8 caracteres.");
  if (password !== passwordConfirmation) throw new Error("As senhas não coincidem.");
  if (input.role !== "admin" && input.role !== "member") throw new Error("Permissão inválida.");

  return { name, email, password, role: input.role };
}
