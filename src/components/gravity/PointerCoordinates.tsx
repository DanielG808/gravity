"use client";

import type { PlayfieldPointer } from "@/src/hooks/usePlayfieldPointer";

type PointerDebugProps = {
  pointer: PlayfieldPointer;
};

export default function PointerCoordinates({ pointer }: PointerDebugProps) {
  return (
    <div className="absolute left-3 top-3 text-xs opacity-70 font-mono text-white/80 select-none pointer-events-none">
      x: {pointer.x.toFixed(0)} y: {pointer.y.toFixed(0)} | nx:{" "}
      {pointer.nx.toFixed(3)} ny: {pointer.ny.toFixed(3)}
    </div>
  );
}
