import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { backend } from "@/lib/backend/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { reviewButtons } from "@/lib/auth/guards";
import type { AuditItem, PublicUser, UserRole } from "@/lib/backend/types";
export const Route = createFileRoute("/usuarios")({ component: UsersPage });
function UsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [message, setMessage] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!token) return;
    try {
      setUsers(await backend.listUsers(token));
      setAudit(await backend.getAuditLog(token));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erro ao carregar.");
    }
  }, [token]);
  useEffect(() => {
    void load();
  }, [load]);
  async function review(userId: string, action: "approve" | "reject") {
    if (!token) return;
    try {
      await backend.reviewUser(token, userId, action);
      setMessage(action === "approve" ? "Usuário aprovado." : "Usuário negado.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erro na revisão.");
    }
  }
  async function deleteUser(userId: string) {
    if (!token) return;
    try {
      setDeletingId(userId);
      await backend.deleteUser(token, userId);
      setPendingDeleteId(null);
      setMessage("Usuário e suas sessões foram excluídos.");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erro ao excluir usuário.");
    } finally {
      setDeletingId(null);
    }
  }
  async function updateRole(userId: string, role: Exclude<UserRole, "owner">) {
    if (!token) return;
    try {
      setChangingRoleId(userId);
      await backend.updateUserRole(token, userId, role);
      setMessage(
        role === "admin" ? "Usuário definido como administrador." : "Usuário definido como membro.",
      );
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erro ao alterar a permissão.");
    } finally {
      setChangingRoleId(null);
    }
  }
  const rows = (items: PublicUser[]) => (
    <div className="space-y-3">
      {items.map((u) => {
        const buttons = reviewButtons(u.status, u.role);
        return (
          <div
            key={u.id}
            className="grid min-w-max items-center gap-4 rounded-md border border-border p-4 md:grid-cols-[minmax(220px,1fr)_120px_190px_auto]"
          >
            <div>
              <strong>{u.name}</strong>
              <p className="text-xs text-muted-foreground">{u.email}</p>
            </div>
            <span className="text-sm uppercase">{u.status}</span>
            {u.role === "owner" ? (
              <span className="text-sm font-semibold uppercase text-gold-soft">Owner</span>
            ) : (
              <Select
                value={u.role}
                disabled={u.status !== "approved" || changingRoleId === u.id}
                onValueChange={(role) => void updateRole(u.id, role as "admin" | "member")}
              >
                <SelectTrigger aria-label={`Permissão de ${u.name}`} className="w-[190px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center justify-end gap-2 whitespace-nowrap">
              {u.role === "owner" ? (
                <span className="rounded-md border border-gold/30 bg-gold/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gold-soft">
                  Conta protegida
                </span>
              ) : (
                <>
                  <Button
                    size="sm"
                    disabled={!buttons.approve}
                    onClick={() => review(u.id, "approve")}
                  >
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!buttons.reject}
                    onClick={() => review(u.id, "reject")}
                  >
                    Negar
                  </Button>
                  {pendingDeleteId !== u.id && (
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Excluir ${u.name}`}
                      title={`Excluir ${u.name}`}
                      onClick={() => setPendingDeleteId(u.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  {pendingDeleteId === u.id && (
                    <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2">
                      <span className="text-xs text-destructive">Excluir {u.name}?</span>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={deletingId === u.id}
                        onClick={() => void deleteUser(u.id)}
                      >
                        {deletingId === u.id ? "Excluindo..." : "Confirmar exclusão"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={deletingId === u.id}
                        onClick={() => setPendingDeleteId(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
  return (
    <AppShell ownerOnly>
      <section className="panel-gold p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="label-gold">Gerenciamento</span>
            <h1 className="mt-1 whitespace-nowrap text-2xl font-bold">Usuários</h1>
          </div>
          <Button asChild>
            <Link to="/usuarios/novo">
              <Plus className="size-4" />
              Adicionar usuário
            </Link>
          </Button>
        </div>
        {message && <p className="mt-4 text-sm text-gold-soft">{message}</p>}
        <Tabs defaultValue="requests" className="mt-5">
          <TabsList>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="requests">Solicitações</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-4">
            {rows(users)}
          </TabsContent>
          <TabsContent value="requests" className="mt-4">
            {rows(users.filter((u) => u.role !== "owner"))}
          </TabsContent>
          <TabsContent value="history" className="mt-4 space-y-2">
            {audit.map((item, i) => (
              <div
                key={`${item.timestamp}-${i}`}
                className="rounded-md border border-border p-3 text-sm"
              >
                {item.timestamp} · {item.action} · {item.targetId}
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </section>
    </AppShell>
  );
}
