import { useEffect, useRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const YELLOW = "#F4D000";
const GREEN = "#2D892C";
const GREEN_DEEP = "#0f3d12";

// Two interpolable point sets describing the same path command sequence
// M  L  L  C(c1,c2,end) C(c1,c2,end) Z   — viewBox 100 x 100, preserveAspectRatio none
const START = [
  100, -2,  100, 102,  58, 102,
  28, 82,  72, 56,  42, 28,
  22, 10,  56, 4,   62, -2,
];
const END = [
  -2, -2,  102, 102,  -2, 102,
  -2, 80,  -2, 55,  -2, 30,
  -2, 10,  -2, 4,   -2, -2,
];

function buildPath(p: number) {
  const v = START.map((s, i) => s + (END[i] - s) * p);
  return `M ${v[0]} ${v[1]} L ${v[2]} ${v[3]} L ${v[4]} ${v[5]} C ${v[6]} ${v[7]} ${v[8]} ${v[9]} ${v[10]} ${v[11]} C ${v[12]} ${v[13]} ${v[14]} ${v[15]} ${v[16]} ${v[17]} Z`;
}

function lerpColor(a: [number, number, number], b: [number, number, number], t: number) {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

export function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const fillPathRef = useRef<SVGPathElement>(null);
  const clipPathRef = useRef<SVGPathElement>(null);
  const topTextRef = useRef<HTMLDivElement>(null); // yellow text inside green (clipped)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const obj = { p: 0 };
      const tl = gsap.to(obj, {
        p: 1,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=100%",
          scrub: 0.6,
          pin: true,
          anticipatePin: 1,
        },
        onUpdate: () => {
          const d = buildPath(obj.p);
          fillPathRef.current?.setAttribute("d", d);
          clipPathRef.current?.setAttribute("d", d);

          // After the green has flooded the screen, morph the yellow text → deep green
          const t = Math.min(1, Math.max(0, (obj.p - 0.78) / 0.22));
          const color = lerpColor([244, 208, 0], [15, 61, 18], t);
          if (topTextRef.current) topTextRef.current.style.color = color;
        },
      });
      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const Content = ({ variant }: { variant: "base" | "top" }) => (
    <div className="relative mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-6 text-center">
      <div
        className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em]"
        style={{
          borderColor: variant === "base" ? GREEN_DEEP : YELLOW,
          color: variant === "base" ? GREEN_DEEP : YELLOW,
        }}
      >
        <Sparkles className="h-3.5 w-3.5" /> Canadá · EUA · México · 19 de Julho
      </div>

      <h1
        className="mt-6 font-display leading-[0.88] text-6xl sm:text-8xl lg:text-[9.5rem]"
        style={{ color: "currentColor" }}
      >
        ÁLBUM
        <span className="block">DE FIGURINHAS</span>
        <span className="mt-2 block text-2xl sm:text-3xl lg:text-4xl tracking-[0.4em]">
          FIFA WORLD CUP 2026
        </span>
      </h1>

      <p
        className="mt-8 max-w-xl text-base sm:text-lg"
        style={{ opacity: 0.92 }}
      >
        Colecione, troque e complete seu álbum digital. Encontre colecionadores
        perto de você e conquiste cada figurinha que falta.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a
          href="#album"
          className="group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-xl transition-all hover:scale-[1.03]"
          style={{
            background: variant === "base" ? GREEN_DEEP : YELLOW,
            color: variant === "base" ? YELLOW : GREEN_DEEP,
          }}
        >
          Começar Agora
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </a>
        <a
          href="#jogadores"
          className="inline-flex items-center gap-2 rounded-full border-2 px-6 py-3 text-sm font-semibold transition-all hover:scale-[1.03]"
          style={{
            borderColor: variant === "base" ? GREEN_DEEP : YELLOW,
            color: variant === "base" ? GREEN_DEEP : YELLOW,
          }}
        >
          Explorar Jogadores
        </a>
      </div>
    </div>
  );

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden"
      style={{ background: YELLOW }}
    >
      {/* SVG defs holding the animated clipPath */}
      <svg className="absolute h-0 w-0" aria-hidden>
        <defs>
          <clipPath id="hero-green-clip" clipPathUnits="objectBoundingBox">
            {/* objectBoundingBox needs 0–1 coords; we use userSpaceOnUse fallback below */}
          </clipPath>
          <clipPath id="hero-green-clip-user" clipPathUnits="userSpaceOnUse">
            <path ref={clipPathRef} d={buildPath(0)} transform="scale(0.01)" />
          </clipPath>
        </defs>
      </svg>

      {/* Base layer: green-text on yellow bg */}
      <div className="absolute inset-0" style={{ color: GREEN_DEEP }}>
        <Content variant="base" />
      </div>

      {/* Green organic shape — fills screen as user scrolls */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path ref={fillPathRef} d={buildPath(0)} fill={GREEN} />
      </svg>

      {/* Top layer: yellow-text (becomes deep green at end), clipped to green shape */}
      <div
        ref={topTextRef}
        className="pointer-events-auto absolute inset-0"
        style={{
          color: YELLOW,
          clipPath: "url(#hero-green-clip-user)",
          WebkitClipPath: "url(#hero-green-clip-user)",
        }}
      >
        <Content variant="top" />
      </div>

      {/* Scroll hint */}
      <div
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.4em]"
        style={{ color: GREEN_DEEP, mixBlendMode: "difference", opacity: 0.7 }}
      >
        Role para revelar ↓
      </div>
    </section>
  );
}
