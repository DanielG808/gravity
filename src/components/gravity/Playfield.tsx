"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePlayfieldPointer } from "@/src/hooks/usePlayfieldPointer";
import PlayfieldBackground from "@/src/components/gravity/PlayfieldBackground";
import PointerReticle from "@/src/components/gravity/PointerReticle";
import PointerCoordinates from "./PointerCoordinates";
import type { BodyState } from "@/src/lib/gravity/types";

export default function Playfield() {
  const playfieldRef = useRef<HTMLElement | null>(null);
  const bodyElRef = useRef<HTMLDivElement | null>(null);

  const rafIdRef = useRef<number | null>(null);
  const lastTRef = useRef<number | null>(null);

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

  useLayoutEffect(() => {
    const el = playfieldRef.current;
    const bodyEl = bodyElRef.current;
    if (!el || !bodyEl) return;

    const r = el.getBoundingClientRect();
    bodyRef.current.x = r.width / 2;
    bodyRef.current.y = r.height / 2;

    bodyEl.style.transform = `translate3d(${bodyRef.current.x}px, ${bodyRef.current.y}px, 0)`;
  }, []);

  useEffect(() => {
    function tick(t: number) {
      const bodyEl = bodyElRef.current;

      const last = lastTRef.current ?? t;
      const dt = Math.min(0.05, (t - last) / 1000);
      lastTRef.current = t;

      if (bodyEl) {
        const body = bodyRef.current;
        bodyEl.style.transform = `translate3d(${body.x}px, ${body.y}px, 0)`;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    }

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
      lastTRef.current = null;
    };
  }, []);

  return (
    <section
      ref={playfieldRef}
      className="relative flex-1 h-full overflow-hidden bg-[#050510]"
    >
      <PlayfieldBackground />

      <div className="relative h-full w-full">
        <div
          ref={bodyElRef}
          className="absolute left-0 top-0 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none bg-white/90 shadow-[0_0_18px_rgba(147,197,253,0.65),0_0_42px_rgba(124,58,237,0.35)]"
        />

        <PointerCoordinates pointer={pointer} />
        <PointerReticle pointer={pointer} />
      </div>
    </section>
  );
}
