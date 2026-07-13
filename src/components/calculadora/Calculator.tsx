import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { StarfieldBackground } from "@/components/brand/StarfieldBackground";
import {
  calculateStorePrice,
  formatCurrency,
  formatPercent,
  parseCurrencyInput,
  parsePercentInput,
} from "@/lib/calculator";
import { CurrencyQuote } from "./CurrencyQuote";

const iconBtn =
  "grid h-11 w-11 place-items-center rounded-md border border-primary/30 bg-primary/10 text-primary shadow-[0_0_18px_rgba(212,175,55,0.18)] transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-[0_0_28px_rgba(212,175,55,0.32)]";

export function Calculator() {
  const [finalValueRaw, setFinalValueRaw] = useState("");
  const [discountRaw, setDiscountRaw] = useState("");
  const [roundUp, setRoundUp] = useState(true);
  const [feedback, setFeedback] = useState("");
  const finalValueRef = useRef<HTMLInputElement>(null);
  // Preserva a posição do cursor relativa à direita (ideal para máscara de moeda)
  const cursorFromRightRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = finalValueRef.current;
    if (!el || document.activeElement !== el) return;
    const fromRight = cursorFromRightRef.current;
    const pos = fromRight == null ? el.value.length : Math.max(0, el.value.length - fromRight);
    el.setSelectionRange(pos, pos);
    cursorFromRightRef.current = null;
  }, [finalValueRaw]);

  const finalValue = useMemo(() => parseCurrencyInput(finalValueRaw), [finalValueRaw]);
  const discountRate = useMemo(() => parsePercentInput(discountRaw), [discountRaw]);

  const result = useMemo(
    () => calculateStorePrice(finalValue, discountRate, roundUp),
    [finalValue, discountRate, roundUp],
  );

  useEffect(() => {
    if (finalValueRaw && discountRaw && discountRate >= 100) {
      setFeedback("O desconto não pode ser 100% ou mais.");
    } else {
      setFeedback("");
    }
  }, [finalValueRaw, discountRaw, discountRate]);

  function handleClear() {
    setFinalValueRaw("");
    setDiscountRaw("");
    setRoundUp(true);
    setFeedback("");
  }

  const hasInput = finalValueRaw || discountRaw;
  const showResult = Boolean(hasInput) && result.roundedStoreValue > 0 && discountRate < 100;

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      {/* Imagem de fundo da calculadora */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-20 bg-background"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(5,5,5,0.55), rgba(5,5,5,0.75)), url("/assets/calculator-bg.png")`,
          backgroundSize: "cover, cover",
          backgroundPosition: "center center, center center",
          backgroundRepeat: "no-repeat, no-repeat",
        }}
      />

      <StarfieldBackground density={0.7} />


      <section className="relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <h2 className="mt-5 text-[clamp(1.9rem,5.2vw,5rem)] font-black uppercase leading-[0.94] tracking-tight text-white">
            Calculadora Comercial
          </h2>

          {/* linha de 4 ícones (referência) */}
          <div className="mt-6 flex items-center gap-3">
            <button type="button" className={iconBtn} aria-label="Desconto">
              <span className="text-lg font-black">%</span>
            </button>
            <button type="button" className={iconBtn} aria-label="Reais">
              <span className="text-[13px] font-black">R$</span>
            </button>
            <button type="button" className={iconBtn} aria-label="App">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <rect x="6" y="3" width="12" height="18" rx="2.5" />
                <line x1="10" y1="18" x2="14" y2="18" />
              </svg>
            </button>
            <button type="button" className={iconBtn} aria-label="Manual">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z" />
                <line x1="8" y1="7" x2="15" y2="7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Grid principal */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* ENTRADA */}
          <form
            className="rounded-xl border border-white/12 bg-card/35 p-6 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[6px] backdrop-saturate-150"
            noValidate
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">Dados do Valor</p>
                <h3 className="mt-1 text-xl font-black uppercase tracking-tight text-white">Entrada</h3>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-md border border-primary/30 bg-primary/10 text-lg font-black text-primary shadow-[0_0_18px_rgba(212,175,55,0.18)]">
                %
              </span>
            </div>

            <label className="mb-4 grid gap-2" htmlFor="finalValue">
              <span className="text-sm font-bold text-foreground/90">Valor que deseja receber</span>
              <div className="relative flex min-h-[56px] items-center rounded-md border border-input bg-secondary/60 px-4 transition-colors focus-within:border-primary/60 focus-within:shadow-[0_0_0_3px_rgba(212,175,55,0.12)]">
                <span className="mr-3 grid h-8 w-8 place-items-center rounded-md border border-primary/25 bg-primary/15 text-sm font-black leading-none pb-[1px] text-primary">
                  $
                </span>
                <input
                  id="finalValue"
                  ref={finalValueRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="R$ 0,00"
                  value={finalValueRaw}
                  onBeforeInput={(e) => {
                    // Bloqueia qualquer caractere que não seja dígito (inclui letras, símbolos e "e")
                    const ev = e as unknown as InputEvent;
                    if (ev.data && /\D/.test(ev.data)) e.preventDefault();
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData("text");
                    const digits = pasted.replace(/\D/g, "").slice(0, 12);
                    setFinalValueRaw(digits ? formatCurrency(Number(digits) / 100) : "");
                  }}
                  onChange={(e) => {
                    const el = e.target;
                    const selEnd = el.selectionEnd ?? el.value.length;
                    // guarda quantos caracteres existem à direita do cursor antes de reformatar
                    cursorFromRightRef.current = el.value.length - selEnd;
                    const digits = el.value.replace(/\D/g, "").slice(0, 12);
                    if (!digits) return setFinalValueRaw("");
                    setFinalValueRaw(formatCurrency(Number(digits) / 100));
                  }}
                  onBlur={(e) => {
                    const digits = e.currentTarget.value.replace(/\D/g, "").slice(0, 12);
                    setFinalValueRaw(digits ? formatCurrency(Number(digits) / 100) : "");
                  }}
                  onFocus={(e) => {
                    const end = e.currentTarget.value.length;
                    e.currentTarget.setSelectionRange(end, end);
                  }}
                  className="w-full bg-transparent text-base font-bold text-foreground outline-none placeholder:text-muted-foreground/50"
                />
              </div>
              <small className="text-xs text-muted-foreground">Somente números — formatado automaticamente em BRL com centavos.</small>
            </label>

            <label className="mb-4 grid gap-2" htmlFor="discountValue">
              <span className="text-sm font-bold text-foreground/90">Porcentagem do desconto</span>
              <div className="relative flex min-h-[56px] items-center rounded-md border border-input bg-secondary/60 px-4 transition-colors focus-within:border-primary/60 focus-within:shadow-[0_0_0_3px_rgba(212,175,55,0.12)]">
                <span className="mr-3 grid h-8 w-8 place-items-center rounded-md border border-primary/25 bg-primary/15 text-sm font-black text-primary">
                  %
                </span>
                <input
                  id="discountValue"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="30%"
                  value={discountRaw}
                  onChange={(e) => setDiscountRaw(e.target.value)}
                  className="w-full bg-transparent text-base font-bold text-foreground outline-none placeholder:text-muted-foreground/50"
                />
              </div>
            </label>

            <label className="mb-6 flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={roundUp}
                onChange={(e) => setRoundUp(e.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className="ml-1 grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-primary/60 bg-transparent text-primary-foreground transition-all peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-2 w-2 scale-0 opacity-0 transition-all peer-checked:scale-100 peer-checked:opacity-100"
                >
                  <path d="M5 12l5 5L20 7" />
                </svg>
              </span>
              <span className="text-sm font-bold text-foreground/90">Arredondar o preço no hub</span>
            </label>

            {feedback && (
              <p className="mb-4 text-sm text-destructive" role="alert" aria-live="polite">
                {feedback}
              </p>
            )}

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleClear}
                className="rounded-md border border-border bg-secondary px-10 py-3 text-xs font-black uppercase tracking-[0.28em] text-foreground/90 transition-all hover:-translate-y-0.5 hover:border-primary/60 hover:text-primary"
              >
                Limpar
              </button>
            </div>
          </form>

          {/* RESULTADO */}
          <section
            className="rounded-xl border border-white/12 bg-card/35 p-6 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-[6px] backdrop-saturate-150"
            aria-live="polite"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">Resultado</p>
                <h3 className="mt-1 text-xl font-black uppercase tracking-tight text-white">
                  Valor para colocar no hub
                </h3>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-md border border-primary/30 bg-primary/10 text-lg font-black leading-none pb-[2px] text-primary shadow-[0_0_18px_rgba(212,175,55,0.18)]">
                $
              </span>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/[0.06] to-primary/[0.02] p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_60px_rgba(212,175,55,0.08)]">
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
                aria-hidden="true"
              />
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground">
                Valor para colocar no hub
              </p>
              <strong className="relative mt-2 block text-[clamp(2.2rem,5.5vw,3.75rem)] font-black text-primary drop-shadow-[0_0_24px_rgba(212,175,55,0.35)]">
                {showResult ? formatCurrency(result.roundedStoreValue) : "R$ 0,00"}
              </strong>
            </div>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              {showResult
                ? `Com ${formatPercent(result.discountRate)}% de desconto, você recebe aproximadamente ${formatCurrency(result.afterDiscountApprox)}.`
                : "Preencha os campos para ver o valor recomendado."}
            </p>

            <CurrencyQuote storeValue={showResult ? result.roundedStoreValue : 0} />
          </section>
        </div>
      </section>
    </main>
  );
}
