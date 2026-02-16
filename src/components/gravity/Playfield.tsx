"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePlayfieldPointer } from "@/src/hooks/usePlayfieldPointer";
import PlayfieldBackground from "@/src/components/gravity/PlayfieldBackground";
import PointerReticle from "@/src/components/gravity/PointerReticle";
import PointerCoordinates from "./PointerCoordinates";
import type { BodyState } from "@/src/lib/gravity/types";

const DAMPING = 0.998;
const G = 120_000;
const SOFTENING = 40;
const MAX_SPEED = 2200;

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

  const pointerRef = useRef(pointer);

  useEffect(() => {
    pointerRef.current = pointer;
  }, [pointer]);

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

  useEffect(() => {
    function tick(t: number) {
      const bodyEl = bodyElRef.current;

      const last = lastTRef.current ?? t;
      const dt = Math.min(0.05, (t - last) / 1000);
      lastTRef.current = t;

      const body = bodyRef.current;
      const p = pointerRef.current;

      const dx = p.x - body.x;
      const dy = p.y - body.y;

      const distSq = dx * dx + dy * dy + SOFTENING * SOFTENING;
      const dist = Math.sqrt(distSq);

      const accel = (G * body.mass) / distSq;

      body.velocityX += (dx / dist) * accel * dt;
      body.velocityY += (dy / dist) * accel * dt;

      const speed = Math.hypot(body.velocityX, body.velocityY);
      if (speed > MAX_SPEED) {
        const s = MAX_SPEED / speed;
        body.velocityX *= s;
        body.velocityY *= s;
      }

      body.x += body.velocityX * dt;
      body.y += body.velocityY * dt;

      body.velocityX *= DAMPING;
      body.velocityY *= DAMPING;

      if (bodyEl) {
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
          className="absolute left-0 top-0 z-30 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/95 shadow-[0_0_22px_rgba(147,197,253,0.8),0_0_60px_rgba(124,58,237,0.45)] ring-2 ring-cyan-200/70"
        />

        <PointerCoordinates pointer={pointer} />
        <PointerReticle pointer={pointer} />
      </div>
    </section>
  );
}
