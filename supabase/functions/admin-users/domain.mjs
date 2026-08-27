export function assertOwnerAction({ caller, action, target }) {
  if (caller?.role !== "owner" || caller?.status !== "approved" || caller?.active !== true) {
    throw new Error("Acesso exclusivo do owner.");
  }
  if (action !== "create" && action !== "delete") throw new Error("Ação inválida.");
  if (action === "delete" && target?.role === "owner")
    throw new Error("A conta owner não pode ser excluída.");
}
