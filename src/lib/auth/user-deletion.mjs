export function assertUserCanBeDeleted(user) {
  if (!user) throw new Error("Usuário não encontrado.");
  if (user.role === "owner") throw new Error("A conta owner não pode ser excluída.");
}

export function removeUserSessions(sessions, userId) {
  return Object.fromEntries(
    Object.entries(sessions).filter(([, sessionUserId]) => sessionUserId !== userId),
  );
}
