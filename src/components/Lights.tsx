import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RevealPhase } from "@/hooks/useLogoAnimation";

interface LightsProps {
  phase: RevealPhase;
  hovered: boolean;
}

/**
 * Cinematic 4-point luxury rig:
 *  key (warm gold) · rim (royal purple) · back (strong gold halo) · fill (very soft)
 */
export function Lights({ phase, hovered }: LightsProps) {
  const key = useRef<THREE.DirectionalLight>(null!);
  const rim = useRef<THREE.PointLight>(null!);
  const back = useRef<THREE.PointLight>(null!);
  const ambient = useRef<THREE.AmbientLight>(null!);

  const reveal = phase >= 4 ? 1 : phase / 4;
  const hover = hovered ? 1.35 : 1;

  useFrame((_, dt) => {
    if (key.current) key.current.intensity += (1.6 * reveal * hover - key.current.intensity) * Math.min(1, dt * 4);
    if (rim.current) rim.current.intensity += (3.2 * reveal * hover - rim.current.intensity) * Math.min(1, dt * 4);
    if (back.current) back.current.intensity += (4.5 * reveal * hover - back.current.intensity) * Math.min(1, dt * 4);
    if (ambient.current) ambient.current.intensity += (0.35 * reveal - ambient.current.intensity) * Math.min(1, dt * 4);
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0} color="#3b2a55" />
      <directionalLight ref={key} position={[3.5, 4, 5]} intensity={0} color="#f5d68a" castShadow />
      <pointLight ref={rim} position={[-4, 2, -3]} intensity={0} color="#9b6cff" distance={18} decay={1.6} />
      <pointLight ref={back} position={[0, 0, -4]} intensity={0} color="#ffcf6a" distance={14} decay={1.8} />
      <pointLight position={[0, -3, 4]} intensity={0.25} color="#ffffff" />
    </>
  );
}

export default Lights;