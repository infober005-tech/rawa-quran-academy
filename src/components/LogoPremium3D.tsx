import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";
import logoAsset from "@/assets/rawa-logo-clean.png.asset.json";
import { useI18n } from "@/lib/i18n";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<Size, number> = {
  sm: 56,
  md: 140,
  lg: 280,
  xl: 460,
};

export interface LogoPremium3DProps {
  size?: Size;
  /** Enable mouse parallax tilt. Defaults: lg/xl true, md/sm false. */
  interactive?: boolean;
  /** Floating golden particles + light dust around the logo. */
  particles?: boolean;
  /** Play the 4s cinematic intro (dark → gold → particles → settle). */
  intro?: boolean;
  /** Background gradient halo behind the logo. */
  halo?: boolean;
  /** Optional aria label. */
  alt?: string;
  className?: string;
}

const GOLD = "#D4AF37";
const PURPLE = "#6A4C93";

/**
 * Premium pseudo-3D logo built with Framer Motion + CSS only.
 * GPU-accelerated transforms, no WebGL — runs smoothly on low-end mobile.
 */
export function LogoPremium3D({
  size = "lg",
  interactive,
  particles,
  intro = false,
  halo = true,
  alt,
  className = "",
}: LogoPremium3DProps) {
  const { t } = useI18n();
  const resolvedAlt = alt ?? t("p.logo.alt");
  const reduce = useReducedMotion();
  const px = SIZE_PX[size];
  const isInteractive = interactive ?? (size === "lg" || size === "xl");
  const showParticles = (particles ?? (size === "lg" || size === "xl")) && !reduce;

  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), { stiffness: 120, damping: 14 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 120, damping: 14 });
  const lx = useTransform(mx, [-0.5, 0.5], ["30%", "70%"]);
  const ly = useTransform(my, [-0.5, 0.5], ["30%", "70%"]);

  const [hovered, setHovered] = useState(false);
  const [shown, setShown] = useState(!intro);

  useEffect(() => {
    if (!intro) return;
    const t = setTimeout(() => setShown(true), 60);
    return () => clearTimeout(t);
  }, [intro]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isInteractive || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
    setHovered(false);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={onLeave}
      className={`relative inline-grid place-items-center select-none ${className}`}
      style={{ width: px, height: px, perspective: 1200 }}
    >
      {/* Halo: gold + purple radial glow */}
      {halo && (
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-full pointer-events-none"
          initial={intro ? { opacity: 0, scale: 0.6 } : false}
          animate={shown ? { opacity: hovered ? 1 : 0.85, scale: hovered ? 1.08 : 1 } : { opacity: 0, scale: 0.6 }}
          transition={{ duration: intro ? 1.4 : 0.6, ease: "easeOut" }}
          style={{
            background: `radial-gradient(circle at 50% 50%, ${GOLD}55 0%, ${GOLD}22 22%, ${PURPLE}33 48%, transparent 72%)`,
            filter: `blur(${Math.max(12, px * 0.08)}px)`,
          }}
        />
      )}

      {/* Slow rotating conic light rays */}
      {halo && !reduce && (
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-full pointer-events-none"
          initial={intro ? { opacity: 0 } : false}
          animate={shown ? { opacity: hovered ? 0.7 : 0.45, rotate: 360 } : { opacity: 0 }}
          transition={{
            opacity: { duration: 1.6, ease: "easeOut" },
            rotate: { duration: 38, repeat: Infinity, ease: "linear" },
          }}
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, ${GOLD}40 14deg, transparent 30deg, transparent 90deg, ${GOLD}30 108deg, transparent 124deg, transparent 180deg, ${GOLD}38 198deg, transparent 216deg, transparent 270deg, ${GOLD}30 288deg, transparent 306deg)`,
            maskImage: "radial-gradient(circle at center, black 30%, transparent 72%)",
            WebkitMaskImage: "radial-gradient(circle at center, black 30%, transparent 72%)",
            mixBlendMode: "screen",
          }}
        />
      )}

      {/* Particles layer */}
      {showParticles && shown && <Particles count={size === "xl" ? 22 : 14} px={px} />}

      {/* 3D depth stack */}
      <motion.div
        className="relative"
        style={{ width: "78%", height: "78%", transformStyle: "preserve-3d", rotateX: rx, rotateY: ry }}
        initial={intro ? { opacity: 0, scale: 0.8, y: 10 } : false}
        animate={
          shown
            ? reduce
              ? { opacity: 1, scale: 1, y: 0 }
              : { opacity: 1, scale: [1, 1.025, 1], y: [0, -6, 0] }
            : { opacity: 0, scale: 0.8 }
        }
        transition={
          reduce
            ? { duration: 0.4 }
            : {
                opacity: { duration: 1.2, ease: "easeOut" },
                scale: { duration: 9, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 9, repeat: Infinity, ease: "easeInOut" },
              }
        }
      >
        {/* Back depth layer (purple ghost) */}
        <img
          aria-hidden
          src={logoAsset.url}
          alt=""
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{
            transform: "translateZ(-22px) scale(1.02)",
            filter: `blur(${px * 0.018}px) drop-shadow(0 0 ${px * 0.08}px ${PURPLE}cc)`,
            opacity: 0.55,
          }}
          draggable={false}
        />
        {/* Mid depth layer (gold ghost) */}
        <img
          aria-hidden
          src={logoAsset.url}
          alt=""
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{
            transform: "translateZ(-10px)",
            filter: `blur(${px * 0.008}px) drop-shadow(0 0 ${px * 0.06}px ${GOLD}aa)`,
            opacity: 0.7,
          }}
          draggable={false}
        />
        {/* Front crisp logo */}
        <img
          src={logoAsset.url}
          alt={resolvedAlt}
          className="relative w-full h-full object-contain"
          style={{
            transform: "translateZ(8px)",
            filter: hovered
              ? `drop-shadow(0 ${px * 0.04}px ${px * 0.08}px rgba(0,0,0,0.35)) drop-shadow(0 0 ${px * 0.05}px ${GOLD})`
              : `drop-shadow(0 ${px * 0.03}px ${px * 0.06}px rgba(0,0,0,0.28))`,
            transition: "filter 400ms ease",
          }}
          draggable={false}
        />

        {/* Dynamic light spot follows cursor */}
        {isInteractive && (
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-full pointer-events-none mix-blend-screen"
            style={{
              background: useTransform(
                [lx, ly],
                ([x, y]) => `radial-gradient(circle at ${x} ${y}, rgba(255,236,180,0.55) 0%, rgba(255,236,180,0) 45%)`,
              ),
              opacity: hovered ? 0.9 : 0.45,
              transition: "opacity 300ms ease",
            }}
          />
        )}

        {/* Golden shimmer pass on hover */}
        {hovered && !reduce && (
          <motion.div
            aria-hidden
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ borderRadius: "999px" }}
          >
            <motion.div
              initial={{ x: "-120%" }}
              animate={{ x: "120%" }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
              className="absolute inset-y-0 w-1/2"
              style={{
                background:
                  "linear-gradient(115deg, transparent 0%, rgba(255,232,170,0.55) 50%, transparent 100%)",
                mixBlendMode: "screen",
              }}
            />
          </motion.div>
        )}
      </motion.div>

      {/* Soft reflection under the logo */}
      {(size === "lg" || size === "xl") && (
        <div
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            bottom: -px * 0.04,
            width: px * 0.5,
            height: px * 0.06,
            background: `radial-gradient(ellipse at center, ${PURPLE}55 0%, transparent 70%)`,
            filter: "blur(8px)",
          }}
        />
      )}
    </div>
  );
}

function Particles({ count, px }: { count: number; px: number }) {
  // Pre-compute deterministic random positions so we don't re-randomize on rerender.
  const items = useRef(
    Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
      const radius = 0.42 + Math.random() * 0.18;
      return {
        x: 50 + Math.cos(angle) * radius * 50,
        y: 50 + Math.sin(angle) * radius * 50,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 6,
        duration: 6 + Math.random() * 6,
        star: Math.random() > 0.7,
      };
    }),
  ).current;

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {items.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.star
              ? "radial-gradient(circle, #ffffff 0%, #ffe8a8 60%, transparent 80%)"
              : "radial-gradient(circle, #ffe8a8 0%, #D4AF37 60%, transparent 80%)",
            boxShadow: `0 0 ${Math.max(4, px * 0.012)}px #D4AF37aa`,
          }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{
            opacity: [0, 0.95, 0],
            scale: [0.4, 1, 0.4],
            y: [0, -10, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default LogoPremium3D;