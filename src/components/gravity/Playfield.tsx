"use client";

import * as React from "react";
import type { Body } from "@/src/hooks/useGravitySim";
import type { PlayfieldPointer } from "@/src/hooks/usePlayfieldPointer";
import PointerReticle from "@/src/components/gravity/PointerReticle";
import PointerAim from "@/src/components/gravity/PointerAim";
import PlayerShip from "./PlayerShip";

type PlayfieldProps = {
  paused: boolean;
  resetNonce: number;
  bodies: Body[];
  shipHit: boolean;
  onBoundsChange: (b: { w: number; h: number }) => void;
  onPointerChange: (p: { x: number; y: number; inside: boolean }) => void;

  onBodyPointerDown: (
    id: string,
    at: { x: number; y: number },
  ) => (e: React.PointerEvent) => void;
  onPlayfieldPointerMove: (at: { x: number; y: number }) => void;
  onPlayfieldPointerUp: () => void;
};

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function toPointer(
  x: number,
  y: number,
  inside: boolean,
  w: number,
  h: number,
): PlayfieldPointer {
  const nx = w > 0 ? clamp((x / w) * 2 - 1, -1, 1) : 0;
  const ny = h > 0 ? clamp((y / h) * 2 - 1, -1, 1) : 0;
  return { x, y, nx, ny, inside };
}

export default function Playfield({
  paused,
  resetNonce,
  bodies,
  shipHit,
  onBoundsChange,
  onPointerChange,
  onBodyPointerDown,
  onPlayfieldPointerMove,
  onPlayfieldPointerUp,
}: PlayfieldProps) {
  const ref = React.useRef<HTMLElement | null>(null);
  const boundsRef = React.useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  const [pointer, setPointer] = React.useState<PlayfieldPointer>({
    x: 0,
    y: 0,
    nx: 0,
    ny: 0,
    inside: false,
  });

  const measure = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    boundsRef.current = { w: r.width, h: r.height };
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

  const applyPointer = React.useCallback(
    (p: { x: number; y: number; inside: boolean }) => {
      const { w, h } = boundsRef.current;
      const next = toPointer(p.x, p.y, p.inside, w, h);
      setPointer(next);
      onPointerChange({ x: next.x, y: next.y, inside: next.inside });
    },
    [onPointerChange],
  );

  return (
    <section
      ref={ref}
      className="relative flex-1 h-full overflow-hidden bg-[#050510] touch-none cursor-none"
      onPointerMove={(e) => {
        const p = toLocal(e);
        if (!p) return;
        applyPointer({ x: p.x, y: p.y, inside: true });
        onPlayfieldPointerMove({ x: p.x, y: p.y });
      }}
      onPointerEnter={(e) => {
        const p = toLocal(e);
        if (!p) return;
        applyPointer({ x: p.x, y: p.y, inside: true });
      }}
      onPointerLeave={() => {
        applyPointer({ x: 0, y: 0, inside: false });
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
        <PointerAim pointer={pointer} bodies={bodies} />
        <PointerReticle pointer={pointer} size={10} />
        <PlayerShip pointer={pointer} hit={shipHit} />

        {bodies.map((b) => {
          const exploding = Boolean(b.destroyed);

          if (exploding) {
            return (
              <div
                key={b.id}
                className="absolute pointer-events-none"
                style={{
                  transform: `translate(${b.pos.x}px, ${b.pos.y}px)`,
                  opacity: paused ? 0.9 : 1,
                }}
              >
                <div
                  className="absolute rounded-full"
                  style={{
                    width: b.radius * 4,
                    height: b.radius * 4,
                    transform: "translate(-50%, -50%)",
                    background:
                      "radial-gradient(circle, rgba(255,220,140,0.95), rgba(255,90,40,0.65), rgba(255,40,0,0.0) 70%)",
                    animation: "explode 420ms ease-out forwards",
                  }}
                />

                <div
                  className="absolute rounded-full border"
                  style={{
                    width: b.radius * 5,
                    height: b.radius * 5,
                    transform: "translate(-50%, -50%)",
                    borderColor: "rgba(255,200,120,0.8)",
                    borderWidth: 2,
                    animation: "shockwave 420ms ease-out forwards",
                  }}
                />
              </div>
            );
          }

          return (
            <div
              key={b.id}
              className="absolute rounded-full select-none cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => {
                const p = toLocal(e);
                if (!p) return;
                applyPointer({ x: p.x, y: p.y, inside: true });
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
          );
        })}
      </div>
    </section>
  );
}
