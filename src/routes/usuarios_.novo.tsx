import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, UserPlus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth/AuthProvider";
import { validateManualUser } from "@/lib/auth/manual-user.mjs";
import { backend } from "@/lib/backend/client";

export const Route = createFileRoute("/usuarios_/novo")({ component: NewUserPage });

function NewUserPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    try {
      setSaving(true);
      setMessage("");
      const user = validateManualUser({
        name,
        email,
        password,
        passwordConfirmation,
        role,
      });
      await backend.saveUser(token, user);
      await navigate({ to: "/usuarios" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível criar o usuário.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell ownerOnly>
      <section className="panel-gold mx-auto max-w-3xl p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="label-gold">Gerenciamento</span>
            <h1 className="mt-1 whitespace-nowrap text-2xl font-bold">Adicionar usuário</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              A conta será criada aprovada e ativa, pronta para acessar o sistema.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/usuarios">
              <ArrowLeft className="size-4" />
              Voltar
            </Link>
          </Button>
        </div>

        <form className="mt-7 space-y-5" onSubmit={submit}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="manual-user-name">Nome</Label>
              <Input
                id="manual-user-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-user-email">E-mail</Label>
              <Input
                id="manual-user-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-user-password">Senha</Label>
              <Input
                id="manual-user-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-user-password-confirmation">Confirmar senha</Label>
              <Input
                id="manual-user-password-confirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                autoComplete="new-password"
                disabled={saving}
              />
            </div>
          </div>

          <div className="max-w-sm space-y-2">
            <Label htmlFor="manual-user-role">Permissão</Label>
            <Select
              value={role}
              disabled={saving}
              onValueChange={(value) => setRole(value as "member" | "admin")}
            >
              <SelectTrigger id="manual-user-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Membro</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {message && (
            <p className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {message}
            </p>
          )}

          <Button type="submit" disabled={saving}>
            <UserPlus className="size-4" />
            {saving ? "Criando usuário..." : "Criar usuário"}
          </Button>
        </form>
      </section>
    </AppShell>
  );
}
