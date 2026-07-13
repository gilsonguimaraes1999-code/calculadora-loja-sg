import { useEffect, useId, useRef, useState } from "react";

const CHANNELS = [
  { name: "Nobre", url: "https://discord.com/channels/755203021490749530/1456831145600876554", icon: "/assets/city-icons/nobre.png" },
  { name: "Santa", url: "https://discord.com/channels/690983940567334964/1392970790990909521", icon: "/assets/city-icons/santa.png" },
  { name: "Maresia", url: "https://discord.com/channels/798594785896038401/1437865692010516652", icon: "/assets/city-icons/maresia.png" },
  { name: "Grande", url: "https://discord.com/channels/788905600699858944/1399497851972616235", icon: "/assets/city-icons/grande.png" },
  { name: "Fronteira", url: "https://discord.com/channels/650318652364685326/1470202175199117354", icon: "/assets/city-icons/fronteira.png" },
  { name: "Malta", url: "https://discord.com/channels/1339311085366280264/1437868461102727249", icon: "/assets/city-icons/malta.png" },
  { name: "Real", url: "https://discord.com/channels/1374564834259243094/1437872721781588039", icon: "/assets/city-icons/real.png" },
  { name: "Prime", url: "https://discord.com/channels/1469070143614222390/1469073396250841119", icon: "/assets/city-icons/prime.png" },
  { name: "KNG", url: "https://discord.com/channels/1301916888430805063/1437677349633261669", icon: "/assets/city-icons/kng.png" },
  { name: "Royal", url: "https://discord.com/channels/1424833746842157108/1424836097942229043", icon: "/assets/city-icons/royal.png" },
  { name: "Liberty99", url: "https://discord.com/channels/1488927675748843582/1488934101493743628", icon: "/assets/city-icons/liberty99.png" },
  { name: "District99", url: "https://discord.com/channels/1432797574603083849/1432837103431188612", icon: "/assets/city-icons/district99.png" },
  { name: "Krown", url: "https://canary.discord.com/channels/1515748314367393833/1515876641287573604", icon: "/assets/city-icons/krown.png" },
  { name: "Orizon", url: "https://discord.com/channels/1482801994459775118/1482808079807545344", icon: "/assets/city-icons/orizon.png" },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function TicketChannels() {
  const [open, setOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function copyLink(index: number) {
    const url = CHANNELS[index].url;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* noop */
      }
      document.body.removeChild(ta);
    }
    setCopiedIndex(index);
    window.setTimeout(() => {
      setCopiedIndex((cur) => (cur === index ? null : cur));
    }, 1400);
  }

  function handleItemKey(e: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      itemsRef.current[(index + 1) % CHANNELS.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      itemsRef.current[(index - 1 + CHANNELS.length) % CHANNELS.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      itemsRef.current[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      itemsRef.current[CHANNELS.length - 1]?.focus();
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  function handleButtonKey(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
      window.setTimeout(() => itemsRef.current[0]?.focus(), 0);
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: open ? "min(15rem, calc(100vw - 2rem))" : "max-content",
      }}
      className="fixed bottom-4 right-4 z-40 transition-[width] duration-300 ease-out sm:bottom-6 sm:right-6"
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={handleButtonKey}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        className={`${focusRing} inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-md border border-primary/30 bg-secondary/70 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-foreground/90 shadow-[0_0_18px_rgba(212,175,55,0.18)] backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/60 hover:text-primary`}
      >
        <span className="whitespace-nowrap">Abrir Ticket</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ${open ? "" : "rotate-180"}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <ul
        id={menuId}
        role="menu"
        aria-label="Canais para abrir ticket"
        aria-hidden={!open}
        className={`absolute bottom-full right-0 mb-2 flex w-full list-none flex-col gap-1 overflow-hidden rounded-xl border bg-secondary/90 shadow-[0_-18px_50px_-12px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md transition-[max-height,opacity,transform,padding,border-color] duration-300 ease-out ${
          open
            ? "max-h-[calc(100vh-8rem)] border-primary/25 p-2 opacity-100 translate-y-0 overflow-y-auto pointer-events-auto"
            : "max-h-0 border-transparent p-0 opacity-0 translate-y-1 pointer-events-none"
        }`}
      >
        {CHANNELS.map((channel, index) => {
          const isCopied = copiedIndex === index;
          return (
            <li key={channel.name} role="none">
              <button
                ref={(el) => {
                  itemsRef.current[index] = el;
                }}
                type="button"
                role="menuitem"
                tabIndex={open ? 0 : -1}
                onClick={() => copyLink(index)}
                onKeyDown={(e) => handleItemKey(e, index)}
                aria-label={`Copiar link do canal ${channel.name}`}
                className={`${focusRing} group flex w-full items-center justify-between gap-2 rounded-md border border-transparent px-2 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-foreground/85 transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <img
                    src={channel.icon}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="h-6 w-6 shrink-0 rounded-sm object-cover ring-1 ring-white/10 transition-all group-hover:ring-primary/60"
                  />
                  <span className="truncate">{channel.name}</span>
                </span>
                <span
                  aria-live="polite"
                  className={`text-[9px] font-black uppercase tracking-[0.22em] transition-opacity duration-200 ${
                    isCopied ? "text-primary opacity-100" : "text-muted-foreground opacity-0 group-hover:opacity-70"
                  }`}
                >
                  {isCopied ? "Copiado!" : "Copiar"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
