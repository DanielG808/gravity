"use client";

import type { PlayfieldPointer } from "@/src/hooks/usePlayfieldPointer";

type PointerReticleProps = {
  pointer: PlayfieldPointer;
  size?: number;
};

export default function PointerReticle({
  pointer,
  size = 8,
}: PointerReticleProps) {
  const r = size / 2;

  return (
    <div
      className="absolute rounded-full bg-white/90 pointer-events-none"
      style={{
        width: size,
        height: size,
        left: pointer.x - r,
        top: pointer.y - r,
        opacity: pointer.inside ? 1 : 0.35,
      }}
    />
  );
}
