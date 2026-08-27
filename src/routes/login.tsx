import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { StarfieldBackground } from "@/components/brand/StarfieldBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { backend } from "@/lib/backend/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { isPasswordRecoveryUrl } from "@/lib/auth/password-recovery.mjs";

export const Route = createFileRoute("/login")({ component: LoginPage });
function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [register, setRegister] = useState(false);
  const [resetMode, setResetMode] = useState(() =>
    typeof window !== "undefined" ? isPasswordRecoveryUrl(window.location.href) : false,
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function requestReset() {
    if (!email.trim()) {
      setMessage("Informe seu e-mail para redefinir a senha.");
      return;
    }
    if (!backend.requestPasswordReset) return;
    setBusy(true);
    setMessage("");
    try {
      await backend.requestPasswordReset(email, `${window.location.origin}/login?mode=recovery`);
      setMessage("Se o e-mail estiver cadastrado, você receberá as instruções de redefinição.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível solicitar a redefinição.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (resetMode) {
        if (!backend.updatePassword) throw new Error("Redefinição indisponível.");
        await backend.updatePassword(password);
        await backend.logout("supabase-session");
        setResetMode(false);
        setPassword("");
        setMessage("Senha redefinida. Entre novamente com a nova senha.");
      } else if (register) {
        const result = await backend.register({ name, email, password });
        setMessage(result.message);
      } else {
        const result = await auth.login(email, password);
        if (result.status === "authenticated") void navigate({ to: "/dashboard" });
        else
          setMessage(
            result.status === "pending"
              ? "Sua solicitação aguarda aprovação."
              : "Sua solicitação foi negada e ainda pode ser aprovada pelo owner.",
          );
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível continuar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <StarfieldBackground density={0.7} />
      <main className="relative z-10 grid min-h-screen place-items-center px-4">
        <section className="w-full max-w-md px-7 py-10">
          <div className="text-center">
            <img
              src="/angel-a.png"
              alt="Calculadora Comercial"
              className="mx-auto h-44 w-44 object-contain sm:h-52 sm:w-52"
            />
            <h1 className="sr-only">
              {resetMode ? "Definir nova senha" : register ? "Solicitar acesso" : "Entrar"}
            </h1>
          </div>
          <form onSubmit={submit} className="mt-4 space-y-4">
            {register && !resetMode && (
              <label className="block text-sm">
                Nome
                <Input
                  className="mt-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
            )}
            {!resetMode && (
              <label className="block text-sm">
                E-mail
                <Input
                  className="mt-2"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
            )}
            <label className="block text-sm">
              Senha
              <div className="relative mt-2">
                <Input
                  className="pr-11"
                  type={showPassword ? "text" : "password"}
                  autoComplete={register || resetMode ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground/65 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:text-gold"
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>
            {message && (
              <p className="rounded-md border border-border p-3 text-sm text-muted-foreground">
                {message}
              </p>
            )}
            <Button className="w-full" disabled={busy}>
              {busy
                ? "Aguarde..."
                : resetMode
                  ? "Salvar nova senha"
                  : register
                    ? "Enviar solicitação"
                    : "Entrar"}
            </Button>
            {!register && !resetMode && backend.requestPasswordReset && (
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm text-muted-foreground"
                disabled={busy}
                onClick={() => void requestReset()}
              >
                Esqueci minha senha
              </Button>
            )}
          </form>
          {!resetMode && (
            <Button
              variant="ghost"
              className="mt-3 w-full"
              onClick={() => {
                setRegister(!register);
                setMessage("");
              }}
            >
              {register ? "Já tenho acesso" : "Solicitar novo acesso"}
            </Button>
          )}
        </section>
      </main>
    </>
  );
}
