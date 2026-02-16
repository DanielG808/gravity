"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePlayfieldPointer } from "@/src/hooks/usePlayfieldPointer";
import PlayfieldBackground from "@/src/components/gravity/PlayfieldBackground";
import PointerReticle from "@/src/components/gravity/PointerReticle";
import PointerCoordinates from "./PointerCoordinates";
import type { Body } from "@/src/hooks/useGravitySim";

type SimPointer = { x: number; y: number; inside: boolean };

type PlayfieldProps = {
  paused: boolean;
  resetNonce: number;
  bodies: Body[];
  onBoundsChange: (b: { w: number; h: number }) => void;
  onPointerChange: (p: SimPointer) => void;
};

export default function Playfield({
  resetNonce,
  bodies,
  onBoundsChange,
  onPointerChange,
}: PlayfieldProps) {
  const playfieldRef = useRef<HTMLElement | null>(null);

  const uiPointer = usePlayfieldPointer(playfieldRef, { clampToBounds: true });

  const insideRef = useRef(false);

  useEffect(() => {
    if (!playfieldRef.current) return;

    const el = playfieldRef.current;

    const update = () => {
      const r = el.getBoundingClientRect();
      onBoundsChange({ w: r.width, h: r.height });
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => ro.disconnect();
  }, [onBoundsChange]);

  const toLocal = (e: React.PointerEvent) => {
    const el = playfieldRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const rendered = useMemo(() => {
    return bodies.map((b) => (
      <div
        key={b.id}
        className="absolute left-0 top-0 z-30 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/95 shadow-[0_0_22px_rgba(147,197,253,0.8),0_0_60px_rgba(124,58,237,0.45)] ring-2 ring-cyan-200/70"
        style={{
          width: b.radius * 2,
          height: b.radius * 2,
          transform: `translate(${b.pos.x}px, ${b.pos.y}px) translate(-50%, -50%)`,
        }}
      />
    ));
  }, [bodies]);

  return (
    <section
      ref={playfieldRef}
      className="relative flex-1 h-full overflow-hidden bg-[#050510]"
      key={resetNonce}
      onPointerEnter={(e) => {
        insideRef.current = true;
        const p = toLocal(e);
        onPointerChange({ ...p, inside: true });
      }}
      onPointerLeave={(e) => {
        insideRef.current = false;
        const p = toLocal(e);
        onPointerChange({ ...p, inside: false });
      }}
      onPointerMove={(e) => {
        const p = toLocal(e);
        onPointerChange({ ...p, inside: insideRef.current });
      }}
    >
      <PlayfieldBackground />

      <div className="relative h-full w-full">
        {rendered}

        <PointerCoordinates pointer={uiPointer} />
        <PointerReticle pointer={uiPointer} />
      </div>
    </section>
  );
}
