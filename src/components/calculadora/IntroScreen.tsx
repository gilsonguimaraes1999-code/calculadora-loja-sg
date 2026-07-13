import { StarfieldBackground } from "@/components/brand/StarfieldBackground";

interface IntroScreenProps {
  onAccess: () => void;
  isVisible: boolean;
}

export function IntroScreen({ onAccess, isVisible }: IntroScreenProps) {
  return (
    <section
      className={`fixed inset-0 z-50 grid place-items-center overflow-hidden transition-opacity duration-700 ${
        isVisible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-label="Acesso inicial"
    >
      <StarfieldBackground className="!fixed" />

      <div className="relative z-10 flex w-full max-w-7xl flex-col items-center px-4 text-center animate-[intro-rise_700ms_ease_both]">
        <div className="relative isolate">
          <span
            className="pointer-events-none absolute inset-6 z-0 rounded-full bg-[#d4af37]/[0.10] blur-2xl"
            aria-hidden="true"
          />
          <img
            src="/assets/alpha-logo.png"
            alt="Alpha"
            className="relative z-10 w-[clamp(160px,32vw,280px)]"
          />
        </div>
        <p className="mt-7 text-[10px] font-black uppercase tracking-[0.42em] text-[#d4af37]">
          Ferramenta comercial
        </p>
        <h1 className="mt-3 w-full max-w-[calc(100vw-36px)] whitespace-nowrap text-[clamp(1.15rem,4.4vw,5rem)] font-black uppercase leading-[0.96] tracking-tight text-white">
          Calculadora Comercial
        </h1>
        <button
          type="button"
          onClick={onAccess}
          className="group relative mt-8 flex w-full max-w-[31rem] items-center justify-center overflow-hidden rounded-lg border border-[#d4af37]/65 bg-black/70 px-8 py-4 text-sm font-black uppercase tracking-[0.42em] text-white/80 shadow-[0_0_0_1px_rgba(212,175,55,0.08),0_0_18px_rgba(212,175,55,0.16),0_0_42px_rgba(212,175,55,0.06),inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-220 hover:-translate-y-0.5 hover:border-[#f9e29f]/70 hover:text-white hover:shadow-[0_0_0_1px_rgba(249,226,159,0.10),0_0_24px_rgba(212,175,55,0.20),0_0_52px_rgba(212,175,55,0.08),inset_0_1px_0_rgba(255,255,255,0.06)]"
        >
          <span className="relative z-10">Acessar</span>
          <span
            className="absolute inset-0 -translate-x-[110%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-[110%]"
            aria-hidden="true"
          />
        </button>
      </div>
    </section>
  );
}
