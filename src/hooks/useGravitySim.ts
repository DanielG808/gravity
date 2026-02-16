import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Vec2 = { x: number; y: number };

export type Body = {
  id: string;
  pos: Vec2;
  vel: Vec2;
  mass: number;
  radius: number;
};

type Pointer = {
  x: number;
  y: number;
  inside: boolean;
};

type SimParams = {
  damping: number;
  g: number;
  softening: number;
  maxSpeed: number;
};

type UseGravitySimArgs = {
  initialPos: Vec2;
  initialVel?: Vec2;
  sim?: Partial<SimParams>;
};

function uid() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `b_${Math.random().toString(16).slice(2)}`
  );
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function mag(x: number, y: number) {
  return Math.sqrt(x * x + y * y);
}

const ELASTICITY = 0.82;
const WALL_EPS = 0.01;
const STOP_VEL = 3;

function collideWithBounds(b: Body, bounds: { w: number; h: number }) {
  const w = bounds.w;
  const h = bounds.h;
  if (w <= 0 || h <= 0) return;

  const r = b.radius;

  const minX = r;
  const maxX = w - r;
  const minY = r;
  const maxY = h - r;

  if (b.pos.x < minX) {
    b.pos.x = minX + WALL_EPS;
    if (b.vel.x < 0) b.vel.x = -b.vel.x * ELASTICITY;
    if (Math.abs(b.vel.x) < STOP_VEL) b.vel.x = 0;
  } else if (b.pos.x > maxX) {
    b.pos.x = maxX - WALL_EPS;
    if (b.vel.x > 0) b.vel.x = -b.vel.x * ELASTICITY;
    if (Math.abs(b.vel.x) < STOP_VEL) b.vel.x = 0;
  }

  if (b.pos.y < minY) {
    b.pos.y = minY + WALL_EPS;
    if (b.vel.y < 0) b.vel.y = -b.vel.y * ELASTICITY;
    if (Math.abs(b.vel.y) < STOP_VEL) b.vel.y = 0;
  } else if (b.pos.y > maxY) {
    b.pos.y = maxY - WALL_EPS;
    if (b.vel.y > 0) b.vel.y = -b.vel.y * ELASTICITY;
    if (Math.abs(b.vel.y) < STOP_VEL) b.vel.y = 0;
  }
}

export function useGravitySim({
  initialPos,
  initialVel = { x: 0, y: 0 },
  sim,
}: UseGravitySimArgs) {
  const params: SimParams = useMemo(
    () => ({
      damping: sim?.damping ?? 0.9995,
      g: sim?.g ?? 3_000_000,
      softening: sim?.softening ?? 40,
      maxSpeed: sim?.maxSpeed ?? 2200,
    }),
    [sim?.damping, sim?.g, sim?.softening, sim?.maxSpeed],
  );

  const [paused, setPaused] = useState(false);

  const pointerRef = useRef<Pointer>({ x: 0, y: 0, inside: false });
  const boundsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  const makeInitialBody = useCallback((): Body => {
    return {
      id: uid(),
      pos: { ...initialPos },
      vel: { ...initialVel },
      mass: 5,
      radius: 14,
    };
  }, [initialPos, initialVel]);

  const initialBodies = useMemo(() => [makeInitialBody()], [makeInitialBody]);

  const bodiesRef = useRef<Body[]>(initialBodies);
  const [bodies, setBodies] = useState<Body[]>(() => initialBodies);

  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  const setPointer = useCallback((p: Pointer) => {
    pointerRef.current = p;
  }, []);

  const setBounds = useCallback((b: { w: number; h: number }) => {
    boundsRef.current = b;
  }, []);

  const reset = useCallback(() => {
    const next = [makeInitialBody()];
    bodiesRef.current = next;
    lastRef.current = null;
    setBodies(next);
  }, [makeInitialBody]);

  const togglePause = useCallback(() => {
    setPaused((p) => !p);
  }, []);

  const addBody = useCallback(
    (bounds?: { w: number; h: number }) => {
      const radius = Math.round(rand(8, 26));
      const mass = Math.round(rand(1, 12));

      const x = bounds
        ? rand(radius, Math.max(radius, bounds.w - radius))
        : initialPos.x + rand(-120, 120);

      const y = bounds
        ? rand(radius, Math.max(radius, bounds.h - radius))
        : initialPos.y + rand(-120, 120);

      const nextBody: Body = {
        id: uid(),
        pos: { x, y },
        vel: { x: rand(-120, 120), y: rand(-120, 120) },
        mass,
        radius,
      };

      const next = [...bodiesRef.current, nextBody];
      bodiesRef.current = next;
      setBodies(next);
    },
    [initialPos.x, initialPos.y],
  );

  const removeLastBody = useCallback(() => {
    const cur = bodiesRef.current;
    if (cur.length <= 1) return;
    const next = cur.slice(0, -1);
    bodiesRef.current = next;
    setBodies(next);
  }, []);

  useEffect(() => {
    const tick = (t: number) => {
      if (lastRef.current == null) lastRef.current = t;
      const dt = Math.min(0.05, (t - lastRef.current) / 1000);
      lastRef.current = t;

      if (!paused) {
        const p = pointerRef.current;
        const bounds = boundsRef.current;

        const next = bodiesRef.current.map((b) => {
          const v = { ...b.vel };
          const pos = { ...b.pos };

          if (p.inside) {
            const dx = p.x - pos.x;
            const dy = p.y - pos.y;

            const dist = mag(dx, dy);
            const s = dist + params.softening;

            const aMag = (params.g * b.mass) / (s * s);

            const nx = dist > 0 ? dx / dist : 0;
            const ny = dist > 0 ? dy / dist : 0;

            v.x += nx * aMag * dt;
            v.y += ny * aMag * dt;
          }

          v.x *= params.damping;
          v.y *= params.damping;

          const sp = mag(v.x, v.y);
          if (sp > params.maxSpeed) {
            const k = params.maxSpeed / sp;
            v.x *= k;
            v.y *= k;
          }

          pos.x += v.x * dt;
          pos.y += v.y * dt;

          const out: Body = { ...b, pos, vel: v };
          collideWithBounds(out, bounds);
          return out;
        });

        bodiesRef.current = next;
        setBodies(next);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [paused, params.damping, params.g, params.maxSpeed, params.softening]);

  return {
    bodies,
    bodiesRef,

    boundsRef,
    setBounds,

    paused,
    setPaused,
    togglePause,
    reset,

    addBody,
    removeLastBody,

    setPointer,
  };
}
