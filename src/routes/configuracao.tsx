import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CircleAlert, CircleCheck, LoaderCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { CitySettings } from "@/components/calc/CitySettings";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { backend } from "@/lib/backend/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { DEFAULT_CITIES } from "@/lib/domain/cities";
import {
  cityToDraft,
  configurationChanges,
  draftsToCities,
  moveCityDraft,
  normalizeCities,
  type CityDraft,
  type ConfigurationChange,
} from "@/lib/domain/city-rules";
import type { AppConfig } from "@/lib/backend/types";
export const Route = createFileRoute("/configuracao")({ component: ConfigurationPage });

type SaveState = {
  open: boolean;
  status: "loading" | "success" | "error";
  changes: ConfigurationChange[];
  error: string;
};

const changeLabel = {
  updated: "Alterada",
  added: "Adicionada",
  removed: "Removida",
} as const;

function ConfigurationPage() {
  const { token } = useAuth();
  const [savedConfig, setSavedConfig] = useState<AppConfig>({ cities: [] });
  const [drafts, setDrafts] = useState<CityDraft[]>([]);
  const [message, setMessage] = useState("");
  const [saveState, setSaveState] = useState<SaveState>({
    open: false,
    status: "loading",
    changes: [],
    error: "",
  });
  useEffect(() => {
    if (token)
      backend
        .getConfig(token)
        .then((config) => {
          const normalized = { cities: normalizeCities(config.cities) };
          setSavedConfig(normalized);
          setDrafts(normalized.cities.map(cityToDraft));
        })
        .catch((e) => setMessage(e.message));
  }, [token]);
  const changes = useMemo(
    () => configurationChanges(savedConfig.cities, drafts),
    [savedConfig.cities, drafts],
  );
  const upsert = (city: CityDraft) =>
    setDrafts((items) =>
      items.some((item) => item.id === city.id)
        ? items.map((item) => (item.id === city.id ? city : item))
        : [...items, city],
    );
  async function save() {
    if (!token) return;
    const pendingChanges = configurationChanges(savedConfig.cities, drafts);
    if (!pendingChanges.length) return;
    setSaveState({ open: true, status: "loading", changes: pendingChanges, error: "" });
    const startedAt = Date.now();
    try {
      const next = await backend.saveConfig(token, { cities: draftsToCities(drafts) });
      const remaining = 650 - (Date.now() - startedAt);
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
      const normalized = { cities: normalizeCities(next.cities) };
      setSavedConfig(normalized);
      setDrafts(normalized.cities.map(cityToDraft));
      setMessage("");
      setSaveState({ open: true, status: "success", changes: pendingChanges, error: "" });
    } catch (e) {
      setSaveState({
        open: true,
        status: "error",
        changes: pendingChanges,
        error: e instanceof Error ? e.message : "Erro ao salvar.",
      });
    }
  }
  return (
    <AppShell configuratorOnly>
      <section className="panel-gold p-5">
        <span className="label-gold">Configurações por cidade</span>
        <h1 className="mt-1 whitespace-nowrap text-2xl font-bold">Cidades e multiplicador TEBEX</h1>
        {message && <p className="mt-4 text-sm text-gold-soft">{message}</p>}
        <div className="mt-6">
          <CitySettings
            cities={drafts}
            changedIds={changes
              .filter((change) => change.type !== "removed")
              .map((change) => change.id)}
            onChange={upsert}
            onRemove={(id) => setDrafts((items) => items.filter((item) => item.id !== id))}
            onMove={(id, direction) => setDrafts((items) => moveCityDraft(items, id, direction))}
            onReset={() => setDrafts(DEFAULT_CITIES.map(cityToDraft))}
          />
        </div>
        <Button className="mt-5" onClick={save} disabled={!changes.length}>
          Salvar configurações
        </Button>
      </section>
      <AlertDialog
        open={saveState.open}
        onOpenChange={(open) => {
          if (!open && saveState.status !== "loading")
            setSaveState((state) => ({ ...state, open: false }));
        }}
      >
        <AlertDialogContent className="max-w-xl border-0 bg-transparent p-0 shadow-none sm:rounded-none">
          <div className="mx-auto w-full px-6 py-8">
            <AlertDialogHeader className="items-center">
              <img
                src="/angel-a.png"
                alt="Calculadora Comercial"
                className="mb-1 h-32 w-32 object-contain"
              />
              <div className="mb-2 flex h-10 items-center justify-center">
                {saveState.status === "loading" && (
                  <LoaderCircle className="size-8 animate-spin text-gold" />
                )}
                {saveState.status === "success" && <CircleCheck className="size-9 text-gold" />}
                {saveState.status === "error" && (
                  <CircleAlert className="size-9 text-destructive" />
                )}
              </div>
              <AlertDialogTitle className="font-display text-center text-2xl font-black whitespace-nowrap uppercase text-white">
                {saveState.status === "loading"
                  ? "Salvando configurações"
                  : saveState.status === "success"
                    ? "Configurações salvas"
                    : "Não foi possível salvar"}
              </AlertDialogTitle>
              <AlertDialogDescription className="max-w-md text-center text-sm text-muted-foreground">
                {saveState.status === "loading"
                  ? saveState.changes.length === 1
                    ? "A cidade abaixo está sendo salva."
                    : "As cidades abaixo estão sendo salvas."
                  : saveState.status === "success"
                    ? "As alterações foram disponibilizadas para todos os usuários."
                    : saveState.error}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="mt-5 max-h-64 space-y-2 overflow-y-auto rounded-xl bg-black/35 p-3 backdrop-blur-sm">
              {saveState.changes.map((change) => (
                <div
                  key={`${change.type}-${change.id}`}
                  className="flex items-center justify-between gap-4 rounded-lg bg-white/[0.045] px-4 py-3"
                >
                  <strong className="whitespace-nowrap text-sm text-white">{change.name}</strong>
                  <span className="whitespace-nowrap text-xs font-semibold uppercase text-gold-soft">
                    {changeLabel[change.type]}
                  </span>
                </div>
              ))}
            </div>
            {saveState.status !== "loading" && (
              <AlertDialogFooter className="mt-5 sm:justify-center">
                <AlertDialogAction className="min-w-36">Fechar</AlertDialogAction>
              </AlertDialogFooter>
            )}
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
