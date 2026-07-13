import { useEffect, useId, useRef, useState } from "react";

const CITIES = [
  { name: "Nobre", url: "https://creator.tebex.io/webstores/1641629/login", icon: "/assets/city-icons/nobre.png" },
  { name: "Santa", url: "https://creator.tebex.io/webstores/1641594/login", icon: "/assets/city-icons/santa.png" },
  { name: "Maresia", url: "https://creator.tebex.io/webstores/1641638/login", icon: "/assets/city-icons/maresia.png" },
  { name: "Grande", url: "https://creator.tebex.io/webstores/1652472/login", icon: "/assets/city-icons/grande.png" },
  { name: "Fronteira", url: "https://creator.tebex.io/webstores/1779819/login", icon: "/assets/city-icons/fronteira.png" },
  { name: "Malta", url: "https://creator.tebex.io/webstores/1641648/login", icon: "/assets/city-icons/malta.png" },
  { name: "Real", url: "https://creator.tebex.io/webstores/1641651/login", icon: "/assets/city-icons/real.png" },
  { name: "Prime", url: "https://creator.tebex.io/webstores/1765929/login", icon: "/assets/city-icons/prime.png" },
  { name: "KNG", url: "https://creator.tebex.io/webstores/1514487/login", icon: "/assets/city-icons/kng.png" },
  { name: "Royal", url: "https://creator.tebex.io/webstores/1755248/login", icon: "/assets/city-icons/royal.png" },
  { name: "Liberty99", url: "https://creator.tebex.io/webstores/1802516/login", icon: "/assets/city-icons/liberty99.png" },
  { name: "District99", url: "https://creator.tebex.io/webstores/1641643/login", icon: "/assets/city-icons/district99.png" },
  { name: "Krown", url: "https://creator.tebex.io/webstores/1844338/login", icon: "/assets/city-icons/krown.png" },
  { name: "Orizon", url: "https://creator.tebex.io/webstores/1817663/login", icon: "/assets/city-icons/orizon.png" },
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function CityLinks() {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemsRef = useRef<Array<HTMLAnchorElement | null>>([]);
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

  useEffect(() => {
    if (open && activeIndex >= 0) {
      itemsRef.current[activeIndex]?.focus();
    }
  }, [open, activeIndex]);

  function openAt(index: number) {
    setOpen(true);
    setActiveIndex(index);
  }

  function handleButtonKey(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openAt(0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      openAt(CITIES.length - 1);
    }
  }

  function handleItemKey(e: React.KeyboardEvent<HTMLAnchorElement>, index: number) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((index + 1) % CITIES.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((index - 1 + CITIES.length) % CITIES.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(CITIES.length - 1);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: open ? "min(14rem, calc(100vw - 2rem))" : "max-content",
      }}
      className="fixed right-4 top-4 z-40 transition-[width] duration-300 ease-out sm:right-6 sm:top-6"
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setActiveIndex(-1);
        }}
        onKeyDown={handleButtonKey}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        className={`${focusRing} inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-md border border-primary/30 bg-secondary/70 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-foreground/90 shadow-[0_0_18px_rgba(212,175,55,0.18)] backdrop-blur-md transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/60 hover:text-primary`}
      >
        <span className="whitespace-nowrap">Link Tebex</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <ul
        id={menuId}
        role="menu"
        aria-label="Cidades Tebex"
        aria-hidden={!open}
        className={`absolute right-0 mt-2 flex w-full list-none flex-col gap-1 overflow-hidden rounded-xl border bg-secondary/90 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md transition-[max-height,opacity,transform,padding,border-color] duration-300 ease-out ${
          open
            ? "max-h-[calc(100vh-6rem)] border-primary/25 p-2 opacity-100 translate-y-0 overflow-y-auto pointer-events-auto"
            : "max-h-0 border-transparent p-0 opacity-0 -translate-y-1 pointer-events-none"
        }`}
      >
        {CITIES.map((city, index) => (
          <li key={city.name} role="none">
            <a
              ref={(el) => {
                itemsRef.current[index] = el;
              }}
              href={city.url}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              onKeyDown={(e) => handleItemKey(e, index)}
              className={`${focusRing} group flex items-center gap-2.5 rounded-md border border-transparent px-2 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-foreground/85 transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary`}
            >
              <img
                src={city.icon}
                alt=""
                aria-hidden="true"
                className="h-6 w-6 rounded-sm object-cover ring-1 ring-white/10 transition-all group-hover:ring-primary/60"
                loading="lazy"
              />
              <span>{city.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
