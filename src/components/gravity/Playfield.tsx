"use client";

import { useRef, useCallback } from "react";
import { usePlayfieldPointer } from "@/src/hooks/usePlayfieldPointer";
import { useLatestRef } from "@/src/hooks/useLatestRef";
import { useRafLoop } from "@/src/hooks/useRafLoop";
import PlayfieldBackground from "@/src/components/gravity/PlayfieldBackground";
import PointerReticle from "@/src/components/gravity/PointerReticle";
import PointerCoordinates from "./PointerCoordinates";
import { useGravityBody } from "@/src/hooks/useGravityBody";

const SIM = {
  damping: 0.998,
  g: 300_000,
  softening: 40,
  maxSpeed: 2200,
};

export default function Playfield() {
  const playfieldRef = useRef<HTMLElement | null>(null);
  const bodyElRef = useRef<HTMLDivElement | null>(null);

  const pointer = usePlayfieldPointer(playfieldRef, {
    clampToBounds: true,
  });

  const pointerRef = useLatestRef(pointer);

  const { step } = useGravityBody({
    playfieldRef,
    bodyElRef,
    pointerRef,
    sim: SIM,
  });

  const onFrame = useCallback(
    (t: number, dt: number) => {
      step(t, dt);
    },
    [step],
  );

  useRafLoop(onFrame);

  return (
    <section
      ref={playfieldRef}
      className="relative flex-1 h-full overflow-hidden bg-[#050510]"
    >
      <PlayfieldBackground />

      <div className="relative h-full w-full">
        <div
          ref={bodyElRef}
          className="absolute left-0 top-0 z-30 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/95 shadow-[0_0_22px_rgba(147,197,253,0.8),0_0_60px_rgba(124,58,237,0.45)] ring-2 ring-cyan-200/70"
        />

        <PointerCoordinates pointer={pointer} />
        <PointerReticle pointer={pointer} />
      </div>
    </section>
  );
}
