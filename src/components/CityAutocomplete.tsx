import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

type City = { name: string; uf: string; label: string };

const ACCENTS = new RegExp("[\\u0300-\\u036f]", "g");
const norm = (s: string) => s.normalize("NFD").replace(ACCENTS, "").toLowerCase();

// Busca as cidades do Brasil na API do IBGE — uma vez só (cache no módulo).
const IBGE = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome&view=nivelado";
let citiesCache: Promise<City[]> | null = null;
function fetchCities(): Promise<City[]> {
  if (!citiesCache) {
    citiesCache = fetch(IBGE)
      .then((r) => {
        if (!r.ok) throw new Error(`IBGE ${r.status}`);
        return r.json();
      })
      .then((rows: any[]) =>
        rows.map((r) => {
          const name = r["municipio-nome"] as string;
          const uf = r["UF-sigla"] as string;
          return { name, uf, label: `${name} - ${uf}` };
        }),
      )
      .catch((err) => {
        citiesCache = null; // permite tentar de novo depois
        throw err;
      });
  }
  return citiesCache;
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
};

export function CityAutocomplete({ value, onChange, id }: Props) {
  const [all, setAll] = useState<City[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [input, setInput] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetchCities()
      .then((list) => alive && setAll(list))
      .catch(() => alive && setLoadFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  // Mantém o texto em sincronia se o valor for limpo de fora (ex.: reset do form).
  useEffect(() => {
    if (value === "") setInput("");
  }, [value]);

  // Fecha ao clicar fora.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const matches = useMemo(() => {
    const q = norm(input.trim());
    if (!q) return [];
    const starts: City[] = [];
    const has: City[] = [];
    for (const c of all) {
      const n = norm(c.name);
      if (n.startsWith(q)) starts.push(c);
      else if (n.includes(q)) has.push(c);
      if (starts.length >= 60) break;
    }
    return [...starts, ...has].slice(0, 60);
  }, [input, all]);

  function pick(c: City) {
    onChange(c.label);
    setInput(c.label);
    setOpen(false);
  }

  function onType(v: string) {
    setInput(v);
    setActive(0);
    setOpen(true);
    onChange(""); // só vale quando uma cidade da lista é escolhida
    if (loadFailed) onChange(v.trim()); // sem API: aceita o texto digitado
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(matches[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative mt-1.5">
      <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        id={id}
        value={input}
        onChange={(e) => onType(e.target.value)}
        onFocus={() => input && setOpen(true)}
        onKeyDown={onKeyDown}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        placeholder={loadFailed ? "Digite sua cidade" : "Comece a digitar… ex.: Belo Horizonte"}
        className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-9 text-sm outline-none ring-[color:var(--fifa-green)] transition-all focus:ring-2"
      />
      {all.length === 0 && !loadFailed && <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}

      {open && matches.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-auto rounded-xl border border-border bg-popover py-1 shadow-xl">
          {matches.map((c, i) => (
            <li key={`${c.name}-${c.uf}`}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(c)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm ${
                  i === active ? "bg-[color:var(--fifa-green)]/10 text-[color:var(--fifa-green)]" : "text-foreground"
                }`}
              >
                <span>{c.name}</span>
                <span className="text-xs font-semibold text-muted-foreground">{c.uf}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {loadFailed && <p className="mt-1 text-[11px] text-muted-foreground">Não foi possível carregar a lista de cidades. Digite manualmente.</p>}
    </div>
  );
}
