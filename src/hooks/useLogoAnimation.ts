import { useEffect, useState } from "react";

export type RevealPhase = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Drives the cinematic reveal phases:
 *  0 dark · 1 spark · 2 light beam · 3 forming · 4 materialize · 5 floating loop
 */
export function useLogoAnimation(opts?: { autoStart?: boolean; webglOk?: boolean }) {
  const { autoStart = true, webglOk = true } = opts ?? {};
  const [phase, setPhase] = useState<RevealPhase>(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!autoStart || !webglOk) return;
    const timeline: Array<[RevealPhase, number]> = [
      [1, 200],
      [2, 900],
      [3, 1900],
      [4, 3200],
      [5, 4600],
    ];
    const timers = timeline.map(([p, t]) => window.setTimeout(() => setPhase(p), t));
    return () => timers.forEach(clearTimeout);
  }, [autoStart, webglOk]);

  return { phase, hovered, setHovered };
}

export const isWebGLAvailable = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch {
    return false;
  }
};