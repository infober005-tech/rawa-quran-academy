import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, AdaptiveDpr, AdaptiveEvents } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { PremiumRawaLogo } from "./PremiumRawaLogo";
import { Particles } from "./Particles";
import { Lights } from "./Lights";
import { PostFX } from "./PostFX";
import { isWebGLAvailable, useLogoAnimation } from "@/hooks/useLogoAnimation";
import emblemAsset from "@/assets/rawa-full.png.asset.json";

interface LogoRevealProps {
  className?: string;
}

/**
 * Cinematic luxury reveal of the Rawa Quran Academy emblem.
 * Dark scene → spark → light beam → particles form logo → final floating loop.
 */
export function LogoReveal({ className }: LogoRevealProps) {
  const [webglOk, setWebglOk] = useState(true);
  useEffect(() => setWebglOk(isWebGLAvailable()), []);

  const { phase, hovered, setHovered } = useLogoAnimation({ webglOk });

  if (!webglOk) {
    return <FallbackReveal className={className} />;
  }

  return (
    <div
      className={`relative w-full aspect-square rounded-[2rem] overflow-hidden ${className ?? ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <DarkBackdrop phase={phase} />
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 5.5], fov: 38 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
        }}
      >
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        <Suspense fallback={null}>
          <Environment preset="studio" />
          <Lights phase={phase} hovered={hovered} />
          <PremiumRawaLogo phase={phase} hovered={hovered} />
          <Particles count={56} phase={phase} hovered={hovered} />
        </Suspense>
        <PostFX phase={phase} hovered={hovered} />
      </Canvas>
      <LightRaysOverlay phase={phase} hovered={hovered} />
      <Vignette />
      <InitialSpark phase={phase} />
      <LoadingShimmer phase={phase} />
    </div>
  );
}

/* ---------- atmosphere layers (cheap CSS, no extra GPU cost) ---------- */

function DarkBackdrop({ phase }: { phase: number }) {
  const intensity = Math.min(1, phase / 5);
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, #2a153f 0%, #160a26 45%, #050108 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-screen pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><path d='M40 0 L80 40 L40 80 L0 40 Z M40 10 L70 40 L40 70 L10 40 Z' fill='none' stroke='%23d6b06a' stroke-width='1'/><circle cx='40' cy='40' r='6' fill='none' stroke='%23d6b06a' stroke-width='1'/></svg>\")",
        }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: 0.15 + intensity * 0.25 }}
        transition={{ duration: 1.2 }}
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,200,110,0.35), transparent 55%)",
        }}
      />
    </>
  );
}

function LightRaysOverlay({ phase, hovered }: { phase: number; hovered: boolean }) {
  const visible = phase >= 2;
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none mix-blend-screen"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{
        opacity: visible ? (hovered ? 0.95 : 0.7) : 0,
        scale: visible ? 1 : 0.6,
      }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      style={{
        background:
          "conic-gradient(from 0deg at 50% 55%, rgba(255,210,120,0) 0deg, rgba(255,210,120,0.18) 14deg, rgba(255,210,120,0) 30deg, rgba(255,210,120,0) 60deg, rgba(255,210,120,0.14) 75deg, rgba(255,210,120,0) 95deg, rgba(255,210,120,0) 180deg, rgba(255,210,120,0.16) 200deg, rgba(255,210,120,0) 220deg, rgba(255,210,120,0) 290deg, rgba(255,210,120,0.16) 310deg, rgba(255,210,120,0) 330deg)",
        maskImage: "radial-gradient(circle at 50% 55%, black 0%, black 30%, transparent 65%)",
        WebkitMaskImage:
          "radial-gradient(circle at 50% 55%, black 0%, black 30%, transparent 65%)",
        animation: visible ? "rawa-rays-spin 22s linear infinite" : undefined,
      }}
    />
  );
}

function Vignette() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(circle at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)",
      }}
    />
  );
}

function InitialSpark({ phase }: { phase: number }) {
  return (
    <AnimatePresence>
      {phase < 3 && (
        <motion.div
          key="spark"
          initial={{ opacity: 0, scale: 0.2 }}
          animate={{ opacity: phase >= 1 ? 1 : 0, scale: phase >= 2 ? 4 : 1 }}
          exit={{ opacity: 0, scale: 6 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{
              background: "radial-gradient(circle, #fff5c2 0%, #ffcf6a 40%, transparent 70%)",
              boxShadow:
                "0 0 40px 12px rgba(255,210,120,0.85), 0 0 120px 40px rgba(255,180,80,0.45)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LoadingShimmer({ phase }: { phase: number }) {
  return (
    <AnimatePresence>
      {phase === 0 && (
        <motion.div
          key="load"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.4em] uppercase text-gold/70"
        >
          rawa · loading
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* --------------------- 2D fallback (no WebGL) ---------------------- */

function FallbackReveal({ className }: { className?: string }) {
  const sparkles = useMemo(
    () =>
      Array.from({ length: 18 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        d: 2 + Math.random() * 4,
        delay: Math.random() * 4,
      })),
    [],
  );
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        setTilt({
          x: ((e.clientY - r.top) / r.height - 0.5) * 14,
          y: ((e.clientX - r.left) / r.width - 0.5) * -14,
        });
      }}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      className={`relative w-full aspect-square rounded-[2rem] overflow-hidden ${className ?? ""}`}
      style={{
        background:
          "radial-gradient(ellipse at 50% 45%, #2a153f 0%, #160a26 45%, #050108 100%)",
      }}
    >
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.d,
            height: s.d,
            background: "radial-gradient(circle, #fff5c2, transparent)",
            animation: `rawa-twinkle 3s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
      <motion.img
        src={emblemAsset.url}
        alt="شعار رواء"
        initial={{ opacity: 0, scale: 0.6, filter: "blur(20px)" }}
        animate={{
          opacity: 1,
          scale: 1,
          filter: "blur(0px)",
          rotateX: tilt.x,
          rotateY: tilt.y,
        }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute inset-0 m-auto w-[72%] h-[72%] object-contain"
        style={{
          filter:
            "drop-shadow(0 0 30px rgba(255,200,110,0.55)) drop-shadow(0 0 80px rgba(155,108,255,0.35))",
          transformStyle: "preserve-3d",
        }}
      />
      <Vignette />
    </div>
  );
}