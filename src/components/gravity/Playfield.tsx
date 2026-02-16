"use client";

import * as React from "react";
import type { Body } from "@/src/hooks/useGravitySim";

type PlayfieldProps = {
  paused: boolean;
  resetNonce: number;
  bodies: Body[];
  onBoundsChange: (b: { w: number; h: number }) => void;
  onPointerChange: (p: { x: number; y: number; inside: boolean }) => void;

  onBodyPointerDown: (
    id: string,
    at: { x: number; y: number },
  ) => (e: React.PointerEvent) => void;
  onPlayfieldPointerMove: (at: { x: number; y: number }) => void;
  onPlayfieldPointerUp: () => void;
};

export default function Playfield({
  paused,
  resetNonce,
  bodies,
  onBoundsChange,
  onPointerChange,
  onBodyPointerDown,
  onPlayfieldPointerMove,
  onPlayfieldPointerUp,
}: PlayfieldProps) {
  const ref = React.useRef<HTMLElement | null>(null);

  const measure = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    onBoundsChange({ w: r.width, h: r.height });
  }, [onBoundsChange]);

  React.useLayoutEffect(() => {
    measure();
  }, [measure, resetNonce]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver(() => measure());
    ro.observe(el);

    const onWin = () => measure();
    window.addEventListener("resize", onWin);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWin);
    };
  }, [measure]);

  const toLocal = React.useCallback((e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    return { x, y, w: r.width, h: r.height };
  }, []);

  return (
    <section
      ref={ref}
      className="relative flex-1 h-full overflow-hidden bg-[#050510] touch-none"
      onPointerMove={(e) => {
        const p = toLocal(e);
        if (!p) return;
        onPointerChange({ x: p.x, y: p.y, inside: true });
        onPlayfieldPointerMove({ x: p.x, y: p.y });
      }}
      onPointerEnter={(e) => {
        const p = toLocal(e);
        if (!p) return;
        onPointerChange({ x: p.x, y: p.y, inside: true });
      }}
      onPointerLeave={() => {
        onPointerChange({ x: 0, y: 0, inside: false });
      }}
      onPointerUp={() => {
        onPlayfieldPointerUp();
      }}
      onPointerCancel={() => {
        onPlayfieldPointerUp();
      }}
    >
      <div className="stars-sm" />
      <div className="stars-md" />
      <div className="stars-lg" />

      <div className="absolute inset-0 opacity-60 [background:radial-gradient(800px_500px_at_30%_40%,rgba(124,58,237,0.18),transparent_60%),radial-gradient(700px_450px_at_70%_60%,rgba(59,130,246,0.14),transparent_60%)]" />

      <div className="relative h-full w-full">
        {bodies.map((b) => (
          <div
            key={b.id}
            className="absolute rounded-full select-none cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => {
              const p = toLocal(e);
              if (!p) return;
              onPointerChange({ x: p.x, y: p.y, inside: true });
              onBodyPointerDown(b.id, { x: p.x, y: p.y })(e);
            }}
            style={{
              width: b.radius * 2,
              height: b.radius * 2,
              transform: `translate(${b.pos.x - b.radius}px, ${b.pos.y - b.radius}px)`,
              backgroundColor: b.color,
              boxShadow: `0 0 ${Math.max(10, b.radius * 1.5)}px ${b.color}`,
              opacity: paused ? 0.9 : 1,
            }}
          />
        ))}
      </div>
    </section>
  );
}
