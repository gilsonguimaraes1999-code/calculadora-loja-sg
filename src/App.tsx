import { useEffect, useState } from "react";

import { Calculator } from "@/components/calculadora/Calculator";
import { CityLinks } from "@/components/calculadora/CityLinks";
import { IntroScreen } from "@/components/calculadora/IntroScreen";
import { TicketChannels } from "@/components/calculadora/TicketChannels";

type AppRoute = "/login" | "/calculator";

function resolveRoute(pathname: string): AppRoute {
  return pathname === "/calculator" ? "/calculator" : "/login";
}

export function App() {
  const [route, setRoute] = useState<AppRoute>(() => resolveRoute(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setRoute(resolveRoute(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    document.documentElement.lang = "pt-BR";
    document.title = "Calculadora Comercial";

    if (window.location.pathname !== route) {
      window.history.replaceState({}, "", route);
    }
  }, [route]);

  function navigate(to: AppRoute) {
    if (window.location.pathname !== to) {
      window.history.pushState({}, "", to);
    }
    setRoute(to);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  if (route === "/login") {
    return <IntroScreen isVisible onAccess={() => navigate("/calculator")} />;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => navigate("/login")}
        className="fixed left-4 top-4 z-40 inline-flex items-center gap-2 rounded-md border border-primary/30 bg-secondary/70 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-foreground/90 shadow-[0_0_18px_rgba(212,175,55,0.18)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:text-primary sm:left-6 sm:top-6"
        aria-label="Voltar ao início"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Voltar
      </button>
      <CityLinks />
      <TicketChannels />
      <Calculator />
    </>
  );
}
