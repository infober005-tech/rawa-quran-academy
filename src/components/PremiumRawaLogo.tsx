import { useMemo, useRef } from "react";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { TextureLoader } from "three";
import logoAsset from "@/assets/rawa-full.png.asset.json";
import type { RevealPhase } from "@/hooks/useLogoAnimation";

interface PremiumRawaLogoProps {
  phase: RevealPhase;
  hovered: boolean;
}

/**
 * 3D circular medal: the uploaded logo image is used DIRECTLY as a texture
 * on the front (and back) face of a thick cylinder. A metallic gold rim
 * surrounds the medal. No part of the logo is recreated — the image itself
 * is mapped onto the geometry.
 */
export function PremiumRawaLogo({ phase, hovered }: PremiumRawaLogoProps) {
  const root = useRef<THREE.Group>(null!);
  const medal = useRef<THREE.Mesh>(null!);
  const { mouse } = useThree();
  const target = useRef({ x: 0, y: 0 });

  const texture = useLoader(TextureLoader, logoAsset.url);
  useMemo(() => {
    texture.anisotropy = 16;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
  }, [texture]);

  // Material per group: [0] side (rim), [1] top (front cap), [2] bottom (back cap)
  const materials = useMemo(() => {
    const rim = new THREE.MeshStandardMaterial({
      color: "#e8c277",
      metalness: 1,
      roughness: 0.18,
      emissive: "#3a2408",
      emissiveIntensity: 0.25,
      envMapIntensity: 1.5,
    });
    const face = new THREE.MeshStandardMaterial({
      map: texture,
      color: "#ffffff",
      metalness: 0.35,
      roughness: 0.45,
      emissive: "#000000",
      envMapIntensity: 1.2,
      transparent: true,
      alphaTest: 0.05,
    });
    const back = new THREE.MeshStandardMaterial({
      map: texture,
      color: "#d9ad60",
      metalness: 0.9,
      roughness: 0.3,
      envMapIntensity: 1.2,
    });
    return [rim, face, back];
  }, [texture]);

  useFrame((state, dt) => {
    if (!root.current) return;
    const t = state.clock.elapsedTime;

    target.current.x += (mouse.y * 0.15 - target.current.x) * 0.05;
    target.current.y += (mouse.x * 0.25 - target.current.y) * 0.05;

    const targetScale = phase < 3 ? 0.001 : phase === 3 ? 0.7 : 1;
    const s = root.current.scale.x + (targetScale - root.current.scale.x) * Math.min(1, dt * 3);
    root.current.scale.setScalar(s);

    if (phase >= 5) {
      // Slow continuous rotation
      root.current.rotation.y += dt * (hovered ? 0.55 : 0.28);
      // Subtle tilt from mouse
      root.current.rotation.x += (target.current.x - root.current.rotation.x) * 0.04;
      // Floating bob handled by Float, plus a breathing scale
      const breathe = 1 + Math.sin(t * 1.1) * 0.015;
      root.current.scale.multiplyScalar(breathe / (root.current.userData.lastBreathe ?? 1));
      root.current.userData.lastBreathe = breathe;
    } else {
      root.current.rotation.x += (target.current.x - root.current.rotation.x) * 0.04;
      root.current.rotation.y += (target.current.y - root.current.rotation.y) * 0.04;
    }
  });

  return (
    <Float speed={1.4} rotationIntensity={0.15} floatIntensity={phase >= 5 ? 0.8 : 0}>
      <group ref={root} scale={0.001}>
        {/* Back glow disc */}
        <mesh position={[0, 0, -0.4]}>
          <circleGeometry args={[1.8, 64]} />
          <meshBasicMaterial color="#9b6cff" transparent opacity={0.22} toneMapped={false} />
        </mesh>

        {/* The medal: cylinder with caps facing camera (rotate X by PI/2) */}
        <mesh
          ref={medal}
          rotation={[Math.PI / 2, 0, 0]}
          material={materials}
          castShadow
          receiveShadow
        >
          {/* radiusTop, radiusBottom, height (thickness), radialSegments */}
          <cylinderGeometry args={[1.45, 1.45, 0.22, 128, 1, false]} />
        </mesh>

        {/* Outer decorative gold ring (slightly larger, thin torus) */}
        <mesh position={[0, 0, 0]}>
          <torusGeometry args={[1.5, 0.05, 32, 128]} />
          <meshStandardMaterial
            color="#f4cf78"
            metalness={1}
            roughness={0.12}
            emissive="#7a4a08"
            emissiveIntensity={0.35}
            envMapIntensity={1.8}
          />
        </mesh>
      </group>
    </Float>
  );
}

export default PremiumRawaLogo;
