"use client";

import { useLayoutEffect, useRef, useCallback } from "react";
import { usePlayfieldPointer } from "@/src/hooks/usePlayfieldPointer";
import { useLatestRef } from "@/src/hooks/useLatestRef";
import { useRafLoop } from "@/src/hooks/useRafLoop";
import PlayfieldBackground from "@/src/components/gravity/PlayfieldBackground";
import PointerReticle from "@/src/components/gravity/PointerReticle";
import PointerCoordinates from "./PointerCoordinates";
import type { BodyState } from "@/src/lib/gravity/types";
import { stepGravity } from "@/src/lib/gravity/sim";

const SIM = {
  damping: 0.998,
  g: 300_000,
  softening: 40,
  maxSpeed: 2200,
};

export default function Playfield() {
  const playfieldRef = useRef<HTMLElement | null>(null);
  const bodyElRef = useRef<HTMLDivElement | null>(null);

  const bodyRef = useRef<BodyState>({
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    mass: 1,
  });

  const pointer = usePlayfieldPointer(playfieldRef, {
    clampToBounds: true,
  });

  const pointerRef = useLatestRef(pointer);

  useLayoutEffect(() => {
    const el = playfieldRef.current;
    const bodyEl = bodyElRef.current;
    if (!el || !bodyEl) return;

    const r = el.getBoundingClientRect();
    const body = bodyRef.current;

    body.x = r.width / 2;
    body.y = r.height / 2;
    body.velocityX = 0;
    body.velocityY = 0;

    bodyEl.style.transform = `translate3d(${body.x}px, ${body.y}px, 0)`;
  }, []);

  const onFrame = useCallback(
    (t: number, dt: number) => {
      const bodyEl = bodyElRef.current;
      if (!bodyEl) return;

      const body = bodyRef.current;
      const p = pointerRef.current;

      stepGravity(body, { x: p.x, y: p.y }, dt, SIM);

      bodyEl.style.transform = `translate3d(${body.x}px, ${body.y}px, 0)`;
    },
    [pointerRef],
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
