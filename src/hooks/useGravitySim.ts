import { useCallback, useEffect, useRef, useState } from "react";

type Vec2 = { x: number; y: number };

type Body = {
  id: string;
  pos: Vec2;
  vel: Vec2;
};

type UseGravitySimArgs = {
  initialPos: Vec2;
  initialVel?: Vec2;
  gravity?: Vec2;
};

function uid() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `b_${Math.random().toString(16).slice(2)}`
  );
}

export function useGravitySim({
  initialPos,
  initialVel = { x: 0, y: 0 },
  gravity = { x: 0, y: 900 },
}: UseGravitySimArgs) {
  const [paused, setPaused] = useState(false);

  const bodiesRef = useRef<Body[]>([
    { id: uid(), pos: { ...initialPos }, vel: { ...initialVel } },
  ]);
  const [bodies, setBodies] = useState<Body[]>(() => [
    { id: uid(), pos: { ...initialPos }, vel: { ...initialVel } },
  ]);

  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  const reset = useCallback(() => {
    const next = [
      { id: uid(), pos: { ...initialPos }, vel: { ...initialVel } },
    ];
    bodiesRef.current = next;
    lastRef.current = null;
    setBodies(next);
  }, [initialPos, initialVel]);

  const togglePause = useCallback(() => {
    setPaused((p) => !p);
  }, []);

  useEffect(() => {
    const tick = (t: number) => {
      if (lastRef.current == null) lastRef.current = t;
      const dt = Math.min(0.05, (t - lastRef.current) / 1000);
      lastRef.current = t;

      if (!paused) {
        const next = bodiesRef.current.map((b) => {
          const v = { ...b.vel };
          const p = { ...b.pos };

          v.x += gravity.x * dt;
          v.y += gravity.y * dt;

          p.x += v.x * dt;
          p.y += v.y * dt;

          return { ...b, pos: p, vel: v };
        });

        bodiesRef.current = next;
        setBodies(next);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [paused, gravity.x, gravity.y]);

  const body = bodies[0] ?? null;

  const pos = body?.pos ?? { x: initialPos.x, y: initialPos.y };
  const posRef = useRef<Vec2>(pos);
  const velRef = useRef<Vec2>(body?.vel ?? { ...initialVel });

  useEffect(() => {
    const b0 = bodiesRef.current[0];
    if (!b0) return;
    posRef.current = { ...b0.pos };
    velRef.current = { ...b0.vel };
  }, [bodies]);

  return {
    bodies,
    bodiesRef,

    pos,
    paused,
    setPaused,
    togglePause,
    reset,

    posRef,
    velRef,
  };
}
