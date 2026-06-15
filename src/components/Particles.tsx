import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RevealPhase } from "@/hooks/useLogoAnimation";

interface ParticlesProps {
  count?: number;
  phase: RevealPhase;
  hovered: boolean;
}

/**
 * GPU-instanced golden dust orbiting the logo. Sparse, elegant, performant.
 */
export function Particles({ count = 64, phase, hovered }: ParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const matRef = useRef<THREE.MeshBasicMaterial>(null!);

  const data = useMemo(() => {
    return Array.from({ length: count }).map(() => {
      const radius = 1.6 + Math.random() * 2.4;
      const theta = Math.random() * Math.PI * 2;
      const y0 = (Math.random() - 0.5) * 2.8;
      const speed = 0.08 + Math.random() * 0.22;
      const size = 0.018 + Math.random() * 0.04;
      const phaseOff = Math.random() * Math.PI * 2;
      return { radius, theta, y0, speed, size, phaseOff };
    });
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const hoverBoost = hovered ? 1.6 : 1;
    const visible = phase >= 2;
    const opacity = visible ? Math.min(1, (phase - 1) * 0.35) : 0;
    if (matRef.current) matRef.current.opacity = opacity;

    for (let i = 0; i < data.length; i++) {
      const p = data[i];
      const a = p.theta + t * p.speed * hoverBoost;
      const x = Math.cos(a) * p.radius;
      const z = Math.sin(a) * p.radius * 0.7;
      const y = p.y0 + Math.sin(t * 0.8 + p.phaseOff) * 0.35;
      const twinkle = 0.6 + 0.4 * Math.sin(t * 3 + p.phaseOff * 5);
      const s = p.size * twinkle * (phase >= 4 ? 1 : 0.6);
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial ref={matRef} color="#ffd98a" transparent opacity={0} toneMapped={false} />
    </instancedMesh>
  );
}

export default Particles;