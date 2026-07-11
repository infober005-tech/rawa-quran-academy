import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import logoAsset from "@/assets/rawa-logo.png.asset.json";
import { useI18n } from "@/lib/i18n";
import { useLogoAnimation, isWebGLAvailable } from "@/hooks/useLogoAnimation";
import { PremiumRawaLogo } from "@/components/PremiumRawaLogo";
import { Lights } from "@/components/Lights";
import { Particles } from "@/components/Particles";
import { PostFX } from "@/components/PostFX";

/** Soft, short, spiritual chime via Web Audio — no external asset. */
function playChime(muted: boolean) {
  if (muted || typeof window === "undefined") return;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(0.18, now + 0.08);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
    master.connect(ctx.destination);
    // perfect-fifth bell: A4 + E5 + A5, sine + soft triangle
    [
      { f: 440, type: "sine" as OscillatorType, g: 1 },
      { f: 659.25, type: "sine" as OscillatorType, g: 0.55 },
      { f: 880, type: "triangle" as OscillatorType, g: 0.35 },
    ].forEach((v) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = v.type;
      o.frequency.setValueAtTime(v.f, now);
      g.gain.setValueAtTime(v.g, now);
      o.connect(g);
      g.connect(master);
      o.start(now);
      o.stop(now + 1.9);
    });
    setTimeout(() => void ctx.close(), 2200);
  } catch {
    /* noop */
  }
}

export function Logo3D() {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [muted, setMuted] = useState(true); // default muted for autoplay policy
  const chimePlayed = useRef(false);

  useEffect(() => {
    setMounted(true);
    setWebgl(isWebGLAvailable());
  }, []);

  const { phase, setHovered: setLogoHover } = useLogoAnimation({ autoStart: mounted, webglOk: webgl });

  // Trigger chime once on materialize phase (if user unmuted before that)
  useEffect(() => {
    if (phase >= 4 && !chimePlayed.current && !muted) {
      chimePlayed.current = true;
      playChime(false);
    }
  }, [phase, muted]);

  // When user toggles sound on after materialize, play immediately once
  const onToggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (!next && phase >= 4 && !chimePlayed.current) {
      chimePlayed.current = true;
      playChime(false);
    }
  };

  if (!mounted || !webgl) {
    return (
      <div className="relative w-full aspect-square flex items-center justify-center">
        <div className="absolute inset-8 rounded-full bg-gradient-to-br from-[#C7A35C]/40 to-[#5E4B7B]/40 blur-3xl animate-pulse" />
        <img
          src={logoAsset.url}
          alt={t("p.logo.alt")}
          className="relative w-[78%] drop-shadow-[0_30px_60px_rgba(94,75,123,0.5)] animate-float"
        />
      </div>
    );
  }

  // Cinematic CSS overlays driven by phase
  const dark = phase < 1 ? 1 : phase < 2 ? 0.85 : phase < 3 ? 0.55 : phase < 4 ? 0.3 : 0;
  const beam = phase >= 1 ? Math.min(1, (phase - 0.4) / 2) : 0;
  const flare = phase >= 4 ? 1 : 0;

  return (
    <div
      className="relative w-full aspect-square overflow-hidden rounded-[2.5rem]"
      onMouseEnter={() => {
        setHovered(true);
        setLogoHover(true);
      }}
      onMouseLeave={() => {
        setHovered(false);
        setLogoHover(false);
      }}
    >
      {/* Deep background dark veil — fades out as reveal progresses */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-[1400ms] ease-out"
        style={{
          opacity: dark,
          background:
            "radial-gradient(ellipse at center, rgba(20,8,42,0.6) 0%, rgba(8,4,20,0.95) 60%, #050210 100%)",
        }}
      />

      {/* Volumetric golden beam behind logo */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-[1600ms] ease-out"
        style={{
          opacity: beam,
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,215,140,0.55) 0%, rgba(199,163,92,0.25) 22%, rgba(94,75,123,0.15) 45%, transparent 70%)",
          mixBlendMode: "screen",
        }}
      />

      {/* Conic golden light rays (slow rotation) */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-[1800ms]"
        style={{
          opacity: beam * 0.55,
          background:
            "conic-gradient(from 0deg, transparent 0deg, rgba(255,214,138,0.25) 18deg, transparent 36deg, transparent 90deg, rgba(255,214,138,0.18) 108deg, transparent 126deg, transparent 180deg, rgba(255,214,138,0.22) 198deg, transparent 216deg, transparent 270deg, rgba(255,214,138,0.18) 288deg, transparent 306deg)",
          maskImage: "radial-gradient(circle at center, black 35%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(circle at center, black 35%, transparent 70%)",
          animation: "rawaSpin 28s linear infinite",
          mixBlendMode: "screen",
        }}
      />

      {/* Cinematic lens flare at materialize */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-[1200ms]"
        style={{ opacity: flare }}
      >
        <div
          className="h-[140%] w-[8px] blur-[2px]"
          style={{
            background: "linear-gradient(to bottom, transparent, rgba(255,238,180,0.85), transparent)",
          }}
        />
      </div>
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-[1200ms]"
        style={{ opacity: flare * 0.7 }}
      >
        <div
          className="w-[140%] h-[6px] blur-[2px]"
          style={{
            background: "linear-gradient(to right, transparent, rgba(255,238,180,0.75), transparent)",
          }}
        />
      </div>

      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 5.2], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <Lights phase={phase} hovered={hovered} />
          <PremiumRawaLogo phase={phase} hovered={hovered} />
          <Particles count={72} phase={phase} hovered={hovered} />
          <Environment preset="sunset" />
          <PostFX phase={phase} hovered={hovered} />
        </Suspense>
      </Canvas>

      {/* Subtle soft golden shimmer overlay every few seconds (post-reveal) */}
      {phase >= 5 && (
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            background:
              "linear-gradient(115deg, transparent 30%, rgba(255,228,160,0.18) 50%, transparent 70%)",
            animation: "rawaShimmer 6.5s ease-in-out infinite",
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* Mute toggle */}
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? t("p.logo.play_sound") : t("p.logo.mute_sound")}
        className="absolute bottom-3 left-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-[#C7A35C]/40 bg-black/40 text-[#f5d68a] backdrop-blur-md transition hover:bg-black/60"
      >
        {muted ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H2v6h4l5 4z" />
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5 6 9H2v6h4l5 4z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>

      <style>{`
        @keyframes rawaSpin { to { transform: rotate(360deg); } }
        @keyframes rawaShimmer {
          0%, 100% { transform: translateX(-30%); opacity: 0; }
          50%      { transform: translateX(30%);  opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

export default Logo3D;