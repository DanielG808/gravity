"use client";

import * as React from "react";
import { usePlayfieldPointer } from "@/src/hooks/usePlayfieldPointer";

export default function Playfield() {
  const playfieldRef = React.useRef<HTMLElement | null>(null);

  const pointer = usePlayfieldPointer(playfieldRef, {
    clampToBounds: true,
  });

  return (
    <section
      ref={playfieldRef}
      className="relative flex-1 h-full overflow-hidden bg-[#050510]"
    >
      <div className="stars-sm" />
      <div className="stars-md" />
      <div className="stars-lg" />

      <div className="absolute inset-0 opacity-60 [background:radial-gradient(800px_500px_at_30%_40%,rgba(124,58,237,0.18),transparent_60%),radial-gradient(700px_450px_at_70%_60%,rgba(59,130,246,0.14),transparent_60%)]" />

      <div className="relative h-full w-full">
        <div className="absolute left-3 top-3 text-xs opacity-70 font-mono text-white/80 select-none pointer-events-none">
          x: {pointer.x.toFixed(0)} y: {pointer.y.toFixed(0)} | nx:{" "}
          {pointer.nx.toFixed(3)} ny: {pointer.ny.toFixed(3)}
        </div>

        <div
          className="absolute h-2 w-2 rounded-full bg-white/90 pointer-events-none"
          style={{
            left: pointer.x - 4,
            top: pointer.y - 4,
            opacity: pointer.inside ? 1 : 0.35,
          }}
        />
      </div>
    </section>
  );
}
