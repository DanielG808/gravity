"use client";

import * as React from "react";
import { usePlayfieldPointer } from "@/src/hooks/usePlayfieldPointer";
import PlayfieldBackground from "@/src/components/gravity/PlayfieldBackground";

import PointerReticle from "@/src/components/gravity/PointerReticle";
import PointerCoordinates from "./PointerCoordinates";

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
      <PlayfieldBackground />

      <div className="relative h-full w-full">
        <PointerCoordinates pointer={pointer} />
        <PointerReticle pointer={pointer} />
      </div>
    </section>
  );
}
