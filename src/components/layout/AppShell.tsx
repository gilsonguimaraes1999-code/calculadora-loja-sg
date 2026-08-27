import { useEffect, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, Settings2, Users } from "lucide-react";
import { StarfieldBackground } from "@/components/brand/StarfieldBackground";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/AuthProvider";
import { usesVectorBackground } from "@/lib/auth/guards";

function ShellBackground({ pathname }: { pathname: string }) {
  if (!usesVectorBackground(pathname)) return <StarfieldBackground density={0.7} />;
  return (
    <img
      src="/fundo-site-vetorial.svg"
      alt=""
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full object-cover object-center"
    />
  );
}

export function AppShell({
  children,
  ownerOnly = false,
  configuratorOnly = false,
}: {
  children: ReactNode;
  ownerOnly?: boolean;
  configuratorOnly?: boolean;
}) {
  const auth = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    if (
      !auth.loading &&
      (!auth.user ||
        (ownerOnly && auth.user.role !== "owner") ||
        (configuratorOnly && auth.user.role !== "owner" && auth.user.role !== "admin"))
    )
      void navigate({ to: auth.user ? "/dashboard" : "/login" });
  }, [auth.loading, auth.user, ownerOnly, configuratorOnly, navigate]);
  if (
    auth.loading ||
    !auth.user ||
    (ownerOnly && auth.user.role !== "owner") ||
    (configuratorOnly && auth.user.role !== "owner" && auth.user.role !== "admin")
  )
    return (
      <>
        <ShellBackground pathname={pathname} />
        <div className="relative z-10 grid min-h-screen place-items-center text-muted-foreground">
          Carregando...
        </div>
      </>
    );
  return (
    <>
      <ShellBackground pathname={pathname} />
      <main className="relative z-10 mx-auto min-h-screen max-w-[96rem] px-4 py-8 md:px-6">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <Link
            to="/dashboard"
            aria-label="Ir para a calculadora"
            className="flex shrink-0 items-center gap-3"
          >
            <img src="/angel-a.png" alt="A" className="h-14 w-auto object-contain" />
            <span className="font-display whitespace-nowrap text-xl font-black uppercase tracking-wider text-white">
              Calculadora Comercial
            </span>
          </Link>
          <nav className="flex flex-wrap gap-2">
            {(auth.user.role === "owner" || auth.user.role === "admin") && (
              <Button asChild variant="outline" size="sm">
                <Link to="/configuracao">
                  <Settings2 className="size-4" />
                  Configurações
                </Link>
              </Button>
            )}
            {auth.user.role === "owner" && (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link to="/usuarios">
                    <Users className="size-4" />
                    Usuários
                  </Link>
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await auth.logout();
                void navigate({ to: "/login" });
              }}
            >
              <LogOut className="size-4" />
              Sair
            </Button>
          </nav>
        </header>
        {children}
      </main>
    </>
  );
}
