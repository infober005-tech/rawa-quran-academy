import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Float, Sparkles, Environment } from "@react-three/drei";
import * as THREE from "three";
import { TextureLoader } from "three";
import logoAsset from "@/assets/rawa-logo.png.asset.json";

function LogoMesh({ hovered }: { hovered: boolean }) {
  const ref = useRef<THREE.Mesh>(null!);
  const texture = useLoader(TextureLoader, logoAsset.url);
  texture.anisotropy = 8;
  const { mouse } = useThree();
  const target = useRef({ x: 0, y: 0 });

  useFrame((_, delta) => {
    if (!ref.current) return;
    target.current.x += (mouse.y * 0.18 - target.current.x) * 0.04;
    target.current.y += (mouse.x * 0.25 - target.current.y) * 0.04;
    ref.current.rotation.x = target.current.x;
    ref.current.rotation.y += delta * 0.18 + (target.current.y - ref.current.rotation.y) * 0.02;
    const s = hovered ? 1.08 : 1;
    ref.current.scale.x += (s - ref.current.scale.x) * 0.08;
    ref.current.scale.y += (s - ref.current.scale.y) * 0.08;
    ref.current.scale.z += (s - ref.current.scale.z) * 0.08;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.8}>
      <mesh ref={ref}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.05}
          emissive={new THREE.Color("#C7A35C")}
          emissiveMap={texture}
          emissiveIntensity={0.35}
          roughness={0.4}
          metalness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </Float>
  );
}

function LightRays() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * 0.05;
  });
  const geometry = useMemo(() => new THREE.CircleGeometry(4.2, 64), []);
  return (
    <mesh ref={ref} position={[0, 0, -1.5]} geometry={geometry}>
      <meshBasicMaterial color="#C7A35C" transparent opacity={0.08} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

function GoldGlow() {
  return (
    <mesh position={[0, 0, -0.5]}>
      <circleGeometry args={[2.4, 64]} />
      <meshBasicMaterial color="#C7A35C" transparent opacity={0.18} blending={THREE.AdditiveBlending} />
    </mesh>
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
        <div className="absolute inset-8 rounded-full bg-gradient-to-br from-[#C7A35C]/40 to-[#5E4B7B]/40 blur-3xl animate-pulse" />
        <img
          src={logoAsset.url}
          alt="شعار رواء"
          className="relative w-[78%] drop-shadow-[0_30px_60px_rgba(94,75,123,0.5)] animate-float"
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
      {/* Soft halo behind canvas */}
      <div className="absolute inset-6 rounded-full bg-gradient-to-br from-[#C7A35C]/30 via-[#8B79A8]/25 to-[#5E4B7B]/30 blur-3xl pointer-events-none" />
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 5.2], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.55} color="#E9DDF0" />
          <pointLight position={[3, 3, 3]} intensity={2.2} color="#C7A35C" />
          <pointLight position={[-3, -2, 2]} intensity={1.6} color="#5E4B7B" />
          <pointLight position={[0, 0, 4]} intensity={0.9} color="#ffffff" />
          <LightRays />
          <GoldGlow />
          <LogoMesh hovered={hovered} />
          <Sparkles count={70} scale={[6, 6, 2]} size={3} speed={0.4} color="#D4AF37" opacity={0.9} />
          <Sparkles count={40} scale={[8, 8, 3]} size={2} speed={0.25} color="#E9DDF0" opacity={0.6} />
          <Environment preset="sunset" />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default Logo3D;