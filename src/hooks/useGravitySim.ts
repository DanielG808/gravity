import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Vec2 = { x: number; y: number };

export type Body = {
  id: string;
  pos: Vec2;
  vel: Vec2;
  mass: number;
  radius: number;
  color: string;
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

function randColor() {
  const roll = Math.random();

  if (roll < 0.22) {
    const light = Math.floor(rand(86, 97));
    const sat = Math.floor(rand(0, 12));
    return `hsl(0 ${sat}% ${light}%)`;
  }

  if (roll < 0.34) {
    const hue = Math.floor(rand(180, 270));
    const sat = Math.floor(rand(65, 90));
    const light = Math.floor(rand(55, 72));
    return `hsl(${hue} ${sat}% ${light}%)`;
  }

  const hue = Math.floor(rand(0, 360));
  const sat = Math.floor(rand(55, 95));
  const light = Math.floor(rand(48, 72));
  return `hsl(${hue} ${sat}% ${light}%)`;
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

function loadGravityStrength() {
  if (typeof window === "undefined") return 1;
  const raw = window.localStorage.getItem("gravity:strength");
  const n = raw == null ? 1 : Number(raw);
  return Number.isFinite(n) ? n : 1;
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

const DRAG_MAX_RELEASE_SPEED = 1400;
const DRAG_VELOCITY_SMOOTHING = 0.35;

const RESTITUTION = 0.88;
const POS_CORRECTION = 1.0;
const SLOP = 0.0;
const COLLISION_PASSES = 8;

function resolvePair(a: Body, b: Body) {
  let dx = b.pos.x - a.pos.x;
  let dy = b.pos.y - a.pos.y;

  const minDist = a.radius + b.radius;
  let dist2 = dx * dx + dy * dy;

  if (dist2 === 0) {
    dx = 1;
    dy = 0;
    dist2 = 1;
  }

  if (dist2 >= minDist * minDist) return false;

  const dist = Math.sqrt(dist2);
  const nx = dx / dist;
  const ny = dy / dist;

  const overlap = minDist - dist;

  const invA = a.mass > 0 ? 1 / a.mass : 0;
  const invB = b.mass > 0 ? 1 / b.mass : 0;
  const invSum = invA + invB;

  if (invSum > 0) {
    const correction = (Math.max(0, overlap - SLOP) * POS_CORRECTION) / invSum;
    const cx = nx * correction;
    const cy = ny * correction;

    a.pos.x -= cx * invA;
    a.pos.y -= cy * invA;
    b.pos.x += cx * invB;
    b.pos.y += cy * invB;
  }

  const rvx = b.vel.x - a.vel.x;
  const rvy = b.vel.y - a.vel.y;
  const velAlongNormal = rvx * nx + rvy * ny;

  if (velAlongNormal > 0 && overlap < 0.25) return true;

  const j = (-(1 + RESTITUTION) * velAlongNormal) / (invSum || 1);
  const ix = j * nx;
  const iy = j * ny;

  a.vel.x -= ix * invA;
  a.vel.y -= iy * invA;
  b.vel.x += ix * invB;
  b.vel.y += iy * invB;

  return true;
}

function solveCollisions(bodies: Body[]) {
  for (let pass = 0; pass < COLLISION_PASSES; pass++) {
    let any = false;

    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        if (resolvePair(bodies[i], bodies[j])) any = true;
      }
    }

    if (!any) break;
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

  const [gravityStrength, setGravityStrength] = useState<number>(1);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setGravityStrength(loadGravityStrength());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("gravity:strength", String(gravityStrength));
  }, [gravityStrength]);

  const pointerRef = useRef<Pointer>({ x: 0, y: 0, inside: false });
  const boundsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  const draggingRef = useRef<{
    id: string;
    offset: Vec2;
    lastPos: Vec2;
    lastT: number;
    releaseVel: Vec2;
  } | null>(null);

  const makeInitialBody = useCallback((): Body => {
    return {
      id: uid(),
      pos: { ...initialPos },
      vel: { ...initialVel },
      mass: 5,
      radius: 14,
      color: randColor(),
    };
  }, [initialPos, initialVel]);

  const stableInitialBodies = useMemo<Body[]>(
    () => [
      {
        id: "seed",
        pos: { ...initialPos },
        vel: { ...initialVel },
        mass: 5,
        radius: 14,
        color: "hsl(230 70% 65%)",
      },
    ],
    [initialPos, initialVel],
  );

  const bodiesRef = useRef<Body[]>(stableInitialBodies);
  const [bodies, setBodies] = useState<Body[]>(() => stableInitialBodies);

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
    draggingRef.current = null;
    lastRef.current = null;
    setBodies(next);
  }, [makeInitialBody]);

  const resetRef = useRef(reset);
  useEffect(() => {
    resetRef.current = reset;
  }, [reset]);

  useEffect(() => {
    resetRef.current();
  }, []);

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
        color: randColor(),
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
    if (
      draggingRef.current &&
      !next.some((b) => b.id === draggingRef.current?.id)
    ) {
      draggingRef.current = null;
    }
    setBodies(next);
  }, []);

  const onBodyPointerDown = useCallback(
    (id: string, at: Vec2) => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const b = bodiesRef.current.find((x) => x.id === id);
      if (!b) return;

      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      draggingRef.current = {
        id,
        offset: { x: b.pos.x - at.x, y: b.pos.y - at.y },
        lastPos: { x: b.pos.x, y: b.pos.y },
        lastT: performance.now(),
        releaseVel: { ...b.vel },
      };

      const next = bodiesRef.current.map((x) =>
        x.id === id ? { ...x, vel: { x: 0, y: 0 } } : x,
      );
      bodiesRef.current = next;
      setBodies(next);
    },
    [],
  );

  const onPlayfieldPointerMove = useCallback((at: Vec2) => {
    const d = draggingRef.current;
    if (!d) return;

    const now = performance.now();
    const nx = at.x + d.offset.x;
    const ny = at.y + d.offset.y;

    const dt = Math.max(0.001, (now - d.lastT) / 1000);
    const instVx = (nx - d.lastPos.x) / dt;
    const instVy = (ny - d.lastPos.y) / dt;

    d.releaseVel.x =
      d.releaseVel.x + (instVx - d.releaseVel.x) * DRAG_VELOCITY_SMOOTHING;
    d.releaseVel.y =
      d.releaseVel.y + (instVy - d.releaseVel.y) * DRAG_VELOCITY_SMOOTHING;

    d.lastPos = { x: nx, y: ny };
    d.lastT = now;

    const next = bodiesRef.current.map((b) => {
      if (b.id !== d.id) return b;
      return { ...b, pos: { x: nx, y: ny }, vel: { x: 0, y: 0 } };
    });

    bodiesRef.current = next;
    setBodies(next);
  }, []);

  const onPlayfieldPointerUp = useCallback(() => {
    const d = draggingRef.current;
    if (!d) return;

    const vx = clamp(
      d.releaseVel.x,
      -DRAG_MAX_RELEASE_SPEED,
      DRAG_MAX_RELEASE_SPEED,
    );
    const vy = clamp(
      d.releaseVel.y,
      -DRAG_MAX_RELEASE_SPEED,
      DRAG_MAX_RELEASE_SPEED,
    );

    const next = bodiesRef.current.map((b) => {
      if (b.id !== d.id) return b;
      return { ...b, vel: { x: vx, y: vy } };
    });

    draggingRef.current = null;
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
        const draggingId = draggingRef.current?.id ?? null;

        const next = bodiesRef.current.map((b) => {
          if (draggingId && b.id === draggingId) return b;

          const v = { ...b.vel };
          const pos = { ...b.pos };

          if (p.inside) {
            const dx = p.x - pos.x;
            const dy = p.y - pos.y;

            const dist = mag(dx, dy);
            const s = dist + params.softening;

            const aMag = ((params.g * b.mass) / (s * s)) * gravityStrength;

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

          return { ...b, pos, vel: v };
        });

        solveCollisions(next);

        for (let i = 0; i < next.length; i++) {
          if (draggingId && next[i].id === draggingId) continue;
          collideWithBounds(next[i], bounds);
        }

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
  }, [
    paused,
    params.damping,
    params.g,
    params.maxSpeed,
    params.softening,
    gravityStrength,
  ]);

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

    gravityStrength,
    setGravityStrength,

    onBodyPointerDown,
    onPlayfieldPointerMove,
    onPlayfieldPointerUp,
    draggingId: draggingRef.current?.id ?? null,
  };
}
