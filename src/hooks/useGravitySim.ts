import { useCallback, useEffect, useRef, useState } from "react";

type Vec2 = { x: number; y: number };

type UseGravitySimArgs = {
  initialPos: Vec2;
  initialVel?: Vec2;
  gravity?: Vec2;
};

export function useGravitySim({
  initialPos,
  initialVel = { x: 0, y: 0 },
  gravity = { x: 0, y: 900 },
}: UseGravitySimArgs) {
  const [paused, setPaused] = useState(false);

  const posRef = useRef<Vec2>({ ...initialPos });
  const velRef = useRef<Vec2>({ ...initialVel });
  const [pos, setPos] = useState<Vec2>({ ...initialPos });

  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  const reset = useCallback(() => {
    posRef.current = { ...initialPos };
    velRef.current = { ...initialVel };
    lastRef.current = null;
    setPos({ ...initialPos });
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
        const p = posRef.current;
        const v = velRef.current;

        v.x += gravity.x * dt;
        v.y += gravity.y * dt;

        p.x += v.x * dt;
        p.y += v.y * dt;

        posRef.current = { ...p };
        velRef.current = { ...v };

        setPos({ ...p });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [paused, gravity.x, gravity.y]);

  return {
    pos,
    paused,
    setPaused,
    togglePause,
    reset,
    posRef,
    velRef,
  };
}
