import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Vector2 } from "three";
import { useMemo } from "react";
import type { RevealPhase } from "@/hooks/useLogoAnimation";

interface PostFXProps {
  phase: RevealPhase;
  hovered: boolean;
}

export function PostFX({ phase, hovered }: PostFXProps) {
  const bloomIntensity = useMemo(() => {
    const base = phase >= 5 ? 1.15 : phase >= 4 ? 0.9 : phase >= 2 ? 0.55 : 0.2;
    return hovered ? base * 1.6 : base;
  }, [phase, hovered]);

  const caOffset = useMemo<[number, number]>(() => [0.0006, 0.0009], []);

  return (
    <EffectComposer multisampling={0} disableNormalPass>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.85}
        mipmapBlur
        radius={0.85}
      />
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={new Vector2(caOffset[0], caOffset[1])}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette eskil={false} offset={0.25} darkness={0.85} />
    </EffectComposer>
  );
}

export default PostFX;