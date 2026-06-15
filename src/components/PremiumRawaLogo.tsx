import { useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { TextureLoader } from "three";
import logoAsset from "@/assets/rawa-logo-clean.png.asset.json";
import type { RevealPhase } from "@/hooks/useLogoAnimation";

interface PremiumRawaLogoProps {
  phase: RevealPhase;
  hovered: boolean;
}

/**
 * Premium luxury logo: embossed gold seal feel.
 * The texture is rendered on a stack of thin planes to fake true 3D extrusion
 * cheaply, with a metallic-gold material for the front face.
 */
export function PremiumRawaLogo({ phase, hovered }: PremiumRawaLogoProps) {
  const root = useRef<THREE.Group>(null!);
  const front = useRef<THREE.Mesh>(null!);
  const shimmer = useRef<THREE.Mesh>(null!);

  const texture = useLoader(TextureLoader, logoAsset.url);
  useMemo(() => {
    texture.anisotropy = 8;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  const { mouse } = useThree();
  const target = useRef({ x: 0, y: 0 });
  const startTime = useRef<number | null>(null);

  // Extrusion: a few layered planes simulate thickness with low cost.
  const layers = useMemo(() => {
    const arr: Array<{ z: number; opacity: number; intensity: number }> = [];
    const N = 6;
    for (let i = 0; i < N; i++) {
      const k = i / (N - 1);
      arr.push({ z: -k * 0.16, opacity: 1, intensity: 0.6 + k * 0.4 });
    }
    return arr.reverse();
  }, []);

  useFrame((state, dt) => {
    if (!root.current) return;
    const t = state.clock.elapsedTime;
    if (startTime.current === null && phase >= 4) startTime.current = t;

    // Camera parallax
    target.current.x += (mouse.y * 0.18 - target.current.x) * 0.045;
    target.current.y += (mouse.x * 0.28 - target.current.y) * 0.045;

    // Reveal scale/opacity
    const revealAmt = Math.min(1, Math.max(0, (phase - 3) / 1.2)); // 0..1 during phase 4
    const settled = phase >= 5 ? 1 : revealAmt;

    const targetScale = phase < 3 ? 0.001 : phase === 3 ? 0.65 : 1;
    root.current.scale.x += (targetScale - root.current.scale.x) * Math.min(1, dt * 3);
    root.current.scale.y += (targetScale - root.current.scale.y) * Math.min(1, dt * 3);
    root.current.scale.z += (targetScale - root.current.scale.z) * Math.min(1, dt * 3);

    // Breathing + shimmer + rotation
    if (phase >= 5) {
      const breathe = 1 + Math.sin(t * 1.1) * 0.012;
      root.current.scale.multiplyScalar(breathe / (root.current.userData.lastBreathe ?? 1));
      root.current.userData.lastBreathe = breathe;

      root.current.rotation.y += dt * (hovered ? 0.35 : 0.18) + (target.current.y - root.current.rotation.y) * 0.02;
      root.current.rotation.x += (target.current.x - root.current.rotation.x) * 0.04;
    } else {
      root.current.rotation.x += (target.current.x - root.current.rotation.x) * 0.04;
      root.current.rotation.y += (target.current.y - root.current.rotation.y) * 0.04;
    }

    // Shimmer sweep
    if (shimmer.current) {
      const sweep = (t % 5) / 5;
      const m = shimmer.current.material as THREE.MeshBasicMaterial;
      m.opacity = settled * (hovered ? 0.55 : 0.32) * Math.sin(sweep * Math.PI);
      shimmer.current.position.x = -2 + sweep * 4;
    }

    // Materials live update
    if (front.current) {
      const mat = front.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.25 + settled * 0.5 + (hovered ? 0.2 : 0);
      mat.opacity = settled;
      mat.transparent = settled < 0.999;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.12} floatIntensity={phase >= 5 ? 0.6 : 0}>
      <group ref={root} scale={0.001}>
        {/* Back glow disc */}
        <mesh position={[0, 0, -0.5]}>
          <circleGeometry args={[1.7, 64]} />
          <meshBasicMaterial color="#9b6cff" transparent opacity={0.18} toneMapped={false} />
        </mesh>

        {/* Extruded stack (back to front) */}
        {layers.map((l, i) => (
          <mesh key={i} position={[0, 0, l.z]} renderOrder={i}>
            <planeGeometry args={[2.6, 2.9]} />
            <meshStandardMaterial
              map={texture}
              transparent
              alphaTest={0.04}
              metalness={0.9}
              roughness={0.22}
              color="#caa15a"
              emissive="#7a4d12"
              emissiveMap={texture}
              emissiveIntensity={0.18 * l.intensity}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        ))}

        {/* Crisp front face with strong metallic look */}
        <mesh ref={front} position={[0, 0, 0.02]}>
          <planeGeometry args={[2.6, 2.9]} />
          <meshStandardMaterial
            map={texture}
            transparent
            alphaTest={0.04}
            metalness={1}
            roughness={0.15}
            color="#e8c277"
            emissive="#f2c75a"
            emissiveMap={texture}
            emissiveIntensity={0.45}
            side={THREE.DoubleSide}
            envMapIntensity={1.4}
          />
        </mesh>

        {/* Shimmer sweep strip clipped by the logo alpha */}
        <mesh ref={shimmer} position={[0, 0, 0.04]}>
          <planeGeometry args={[0.6, 3.2]} />
          <meshBasicMaterial
            map={texture}
            alphaMap={texture}
            color="#fff6d6"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </Float>
  );
}

export default PremiumRawaLogo;