import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Float, Sparkles, Environment } from "@react-three/drei";
import * as THREE from "three";
import { TextureLoader } from "three";
import logoUrl from "@/assets/rawa-logo-3d.png";

function LogoMesh({ hovered }: { hovered: boolean }) {
  const ref = useRef<THREE.Mesh>(null!);
  const texture = useLoader(TextureLoader, logoUrl);
  texture.anisotropy = 8;
  const { mouse } = useThree();
  const target = useRef({ x: 0, y: 0 });

  useFrame((_, delta) => {
    if (!ref.current) return;
    target.current.x += (mouse.y * 0.12 - target.current.x) * 0.04;
    target.current.y += (mouse.x * 0.18 - target.current.y) * 0.04;
    ref.current.rotation.x = target.current.x;
    ref.current.rotation.y += (target.current.y - ref.current.rotation.y) * 0.04;
    const s = hovered ? 1.06 : 1;
    ref.current.scale.x += (s - ref.current.scale.x) * 0.08;
    ref.current.scale.y += (s - ref.current.scale.y) * 0.08;
    ref.current.scale.z += (s - ref.current.scale.z) * 0.08;
  });

  return (
    <Float speed={1.6} rotationIntensity={0.08} floatIntensity={1.1}>
      <mesh ref={ref}>
        <planeGeometry args={[3.6, 3.6]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.05}
          emissive={new THREE.Color("#C7A35C")}
          emissiveMap={texture}
          emissiveIntensity={0.25}
          roughness={0.5}
          metalness={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
    </Float>
  );
}

export function Logo3D() {
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    setMounted(true);
    try {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl2") || c.getContext("webgl");
      if (!gl) setWebgl(false);
    } catch {
      setWebgl(false);
    }
  }, []);

  if (!mounted || !webgl) {
    return (
      <div className="relative w-full aspect-square flex items-center justify-center">
        <img
          src={logoUrl}
          alt="شعار رواء"
          className="relative w-[88%] drop-shadow-[0_40px_80px_rgba(94,75,123,0.45)] animate-float"
        />
      </div>
    );
  }

  return (
    <div
      className="relative w-full aspect-square"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 5.2], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} color="#F4ECDC" />
          <pointLight position={[3, 3, 3]} intensity={1.6} color="#C7A35C" />
          <pointLight position={[-3, -2, 2]} intensity={1.2} color="#8B79A8" />
          <pointLight position={[0, 0, 4]} intensity={0.7} color="#ffffff" />
          <LogoMesh hovered={hovered} />
          <Sparkles count={90} scale={[7, 7, 2]} size={2.5} speed={0.35} color="#D4AF37" opacity={0.9} />
          <Sparkles count={50} scale={[9, 9, 3]} size={1.5} speed={0.2} color="#E9DDF0" opacity={0.55} />
          <Environment preset="sunset" />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default Logo3D;