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
  destroyed?: boolean;
  destroyedAt?: number;
};

export type Bullet = {
  id: string;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  ttl: number;
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

function massToRadius(mass: number) {
  const m = Math.max(1, mass);
  return Math.max(4, Math.sqrt(m) * 6);
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

const SHIP_RADIUS = 24;
const EXPLOSION_DURATION = 420;

const SHIP_MAX_HP = 100;
const SHIP_INVULN_MS = 450;

const BULLET_SPEED = 1800;
const BULLET_RADIUS = 4;
const BULLET_TTL_S = 1.25;
const FIRE_COOLDOWN_MS = 110;

function damageFromBody(b: Body) {
  return clamp(Math.round(b.mass * 2.6), 2, 40);
}

function sameIds(a: string[], b: string[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

const SPAWN_MAX_BODIES = 28;
const SPAWN_BASE_INTERVAL_MS = 1700;
const SPAWN_MIN_INTERVAL_MS = 420;
const SPAWN_INTERVAL_DECAY_PER_S = 0.985;
const SPAWN_BASE_MEAN_MASS = 6;
const SPAWN_MASS_PER_S = 0.085;
const SPAWN_MASS_JITTER = 0.55;
const SPAWN_MAX_MASS = 30;
const SPAWN_TRIES = 60;
const SPAWN_PADDING = 6;
const SPAWN_SHIP_SAFE_PAD = 90;

const LEVEL_BASE_GOAL = 12;
const LEVEL_GOAL_PER_LEVEL = 6;
const LEVEL_BASE_MAX_ACTIVE = 10;
const LEVEL_MAX_ACTIVE_PER_LEVEL = 2;

function activeBodiesCount(list: Body[]) {
  let n = 0;
  for (let i = 0; i < list.length; i++) if (!list[i].destroyed) n++;
  return n;
}

function findSafeSpawnPos(args: {
  bounds: { w: number; h: number };
  bodies: Body[];
  radius: number;
  ship: { x: number; y: number; active: boolean };
}) {
  const { bounds, bodies, radius, ship } = args;
  const w = bounds.w;
  const h = bounds.h;

  const minX = radius;
  const maxX = w - radius;
  const minY = radius;
  const maxY = h - radius;

  if (w <= radius * 2 + 2 || h <= radius * 2 + 2) return null;

  const shipSafeR = ship.active
    ? radius + SHIP_RADIUS + SPAWN_SHIP_SAFE_PAD
    : 0;

  const okAt = (x: number, y: number) => {
    if (ship.active) {
      const dxs = x - ship.x;
      const dys = y - ship.y;
      if (dxs * dxs + dys * dys <= shipSafeR * shipSafeR) return false;
    }

    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (b.destroyed) continue;
      const rr = radius + b.radius + SPAWN_PADDING;
      const dx = x - b.pos.x;
      const dy = y - b.pos.y;
      if (dx * dx + dy * dy <= rr * rr) return false;
    }

    return true;
  };

  for (let i = 0; i < SPAWN_TRIES; i++) {
    const x = rand(minX, Math.max(minX, maxX));
    const y = rand(minY, Math.max(minY, maxY));
    if (okAt(x, y)) return { x, y };
  }

  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  const ringMax = Math.max(w, h);

  for (let ring = 24; ring <= ringMax; ring += 24) {
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const x = clamp(cx + Math.cos(a) * ring, minX, maxX);
      const y = clamp(cy + Math.sin(a) * ring, minY, maxY);
      if (okAt(x, y)) return { x, y };
    }
  }

  return null;
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

  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);

  type GameStatus = "playing" | "gameover";
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const gameStatusRef = useRef<GameStatus>("playing");

  const scoredDestroyedRef = useRef<Set<string>>(new Set());

  const [level, setLevel] = useState(1);
  const levelRef = useRef(1);

  const [levelProgress, setLevelProgress] = useState(0);
  const levelProgressRef = useRef(0);

  const [levelGoal, setLevelGoal] = useState(LEVEL_BASE_GOAL);
  const levelGoalRef = useRef(LEVEL_BASE_GOAL);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    gameStatusRef.current = gameStatus;
  }, [gameStatus]);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    levelProgressRef.current = levelProgress;
  }, [levelProgress]);

  useEffect(() => {
    levelGoalRef.current = levelGoal;
  }, [levelGoal]);

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

  const bulletsRef = useRef<Bullet[]>([]);
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const lastFireAtRef = useRef<number>(0);
  const aimDirRef = useRef<Vec2>({ x: 0, y: -1 });
  const lastPointerPosRef = useRef<Vec2 | null>(null);

  const draggingRef = useRef<{
    id: string;
    offset: Vec2;
    lastPos: Vec2;
    lastT: number;
    releaseVel: Vec2;
  } | null>(null);

  const spawnStartedAtRef = useRef<number>(0);
  const nextSpawnAtRef = useRef<number>(0);

  const computeSpawnIntervalMs = useCallback((elapsedS: number) => {
    const interval =
      SPAWN_BASE_INTERVAL_MS * Math.pow(SPAWN_INTERVAL_DECAY_PER_S, elapsedS);
    return clamp(interval, SPAWN_MIN_INTERVAL_MS, SPAWN_BASE_INTERVAL_MS);
  }, []);

  const computeSpawnMass = useCallback((elapsedS: number) => {
    const mean = SPAWN_BASE_MEAN_MASS + elapsedS * SPAWN_MASS_PER_S;
    const jittered = mean * rand(1 - SPAWN_MASS_JITTER, 1 + SPAWN_MASS_JITTER);
    return clamp(Math.round(jittered), 1, SPAWN_MAX_MASS);
  }, []);

  const computeLevelGoal = useCallback((lvl: number) => {
    return Math.max(1, LEVEL_BASE_GOAL + (lvl - 1) * LEVEL_GOAL_PER_LEVEL);
  }, []);

  const computeLevelMaxActiveBodies = useCallback((lvl: number) => {
    const raw = LEVEL_BASE_MAX_ACTIVE + (lvl - 1) * LEVEL_MAX_ACTIVE_PER_LEVEL;
    return clamp(raw, 1, SPAWN_MAX_BODIES);
  }, []);

  const makeInitialBody = useCallback((): Body => {
    const mass = 5;
    return {
      id: uid(),
      pos: { ...initialPos },
      vel: { ...initialVel },
      mass,
      radius: massToRadius(mass),
      color: randColor(),
    };
  }, [initialPos, initialVel]);

  const stableInitialBodies = useMemo<Body[]>(() => {
    const mass = 5;
    return [
      {
        id: "seed",
        pos: { ...initialPos },
        vel: { ...initialVel },
        mass,
        radius: massToRadius(mass),
        color: "hsl(230 70% 65%)",
      },
    ];
  }, [initialPos, initialVel]);

  const bodiesRef = useRef<Body[]>(stableInitialBodies);
  const [bodies, setBodies] = useState<Body[]>(() => stableInitialBodies);

  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  const [shipCollisions, setShipCollisions] = useState<string[]>([]);
  const shipCollisionsRef = useRef<string[]>([]);

  const shipHpRef = useRef<number>(SHIP_MAX_HP);
  const shipInvulnUntilRef = useRef<number>(0);
  const [shipHp, setShipHp] = useState<number>(SHIP_MAX_HP);

  const [shipExplosion, setShipExplosion] = useState<Vec2 | null>(null);
  const explosionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (explosionTimeoutRef.current != null) {
        window.clearTimeout(explosionTimeoutRef.current);
        explosionTimeoutRef.current = null;
      }
    };
  }, []);

  const triggerShipExplosion = useCallback((pos: Vec2) => {
    if (explosionTimeoutRef.current != null) {
      window.clearTimeout(explosionTimeoutRef.current);
      explosionTimeoutRef.current = null;
    }

    setShipExplosion(pos);

    explosionTimeoutRef.current = window.setTimeout(() => {
      setShipExplosion(null);
      explosionTimeoutRef.current = null;
    }, EXPLOSION_DURATION);
  }, []);

  const setPointer = useCallback((p: Pointer) => {
    pointerRef.current = p;

    if (p.inside) {
      const prev = lastPointerPosRef.current;
      if (prev) {
        const dx = p.x - prev.x;
        const dy = p.y - prev.y;
        const d = mag(dx, dy);
        if (d > 0.0001) {
          aimDirRef.current = { x: dx / d, y: dy / d };
        }
      }
      lastPointerPosRef.current = { x: p.x, y: p.y };
    } else {
      lastPointerPosRef.current = null;
    }
  }, []);

  const setBounds = useCallback((b: { w: number; h: number }) => {
    boundsRef.current = b;
  }, []);

  const fireBullet = useCallback(() => {
    if (gameStatusRef.current !== "playing") return;
    if (shipHpRef.current <= 0) return;

    const now = performance.now();
    if (now - lastFireAtRef.current < FIRE_COOLDOWN_MS) return;

    const p = pointerRef.current;
    if (!p.inside) return;

    lastFireAtRef.current = now;

    const nx = 0;
    const ny = -1;

    const spawnX = p.x;
    const spawnY = p.y + ny * (SHIP_RADIUS + BULLET_RADIUS + 2);

    const bullet: Bullet = {
      id: uid(),
      pos: { x: spawnX, y: spawnY },
      vel: { x: nx * BULLET_SPEED, y: ny * BULLET_SPEED },
      radius: BULLET_RADIUS,
      ttl: BULLET_TTL_S,
    };

    const next = [...bulletsRef.current, bullet];
    bulletsRef.current = next;
    setBullets(next);
  }, []);

  const onPlayfieldPointerDown = useCallback(
    (at: Vec2) => (e: React.PointerEvent) => {
      e.preventDefault();
      pointerRef.current = { x: at.x, y: at.y, inside: true };
      fireBullet();
    },
    [fireBullet],
  );

  const resetSpawning = useCallback(() => {
    const now = performance.now();
    spawnStartedAtRef.current = now;
    nextSpawnAtRef.current = now + SPAWN_BASE_INTERVAL_MS;
  }, []);

  const resetLeveling = useCallback(() => {
    const lvl = 1;
    const goal = computeLevelGoal(lvl);

    levelRef.current = lvl;
    setLevel(lvl);

    levelProgressRef.current = 0;
    setLevelProgress(0);

    levelGoalRef.current = goal;
    setLevelGoal(goal);
  }, [computeLevelGoal]);

  const registerDestroyedBodies = useCallback(
    (count: number) => {
      if (count <= 0) return;

      let prog = levelProgressRef.current + count;
      let lvl = levelRef.current;
      let goal = levelGoalRef.current;

      while (prog >= goal) {
        prog -= goal;
        lvl += 1;
        goal = computeLevelGoal(lvl);
      }

      if (lvl !== levelRef.current) {
        levelRef.current = lvl;
        setLevel(lvl);
      }

      if (goal !== levelGoalRef.current) {
        levelGoalRef.current = goal;
        setLevelGoal(goal);
      }

      if (prog !== levelProgressRef.current) {
        levelProgressRef.current = prog;
        setLevelProgress(prog);
      }
    },
    [computeLevelGoal],
  );

  const reset = useCallback(() => {
    const next = [makeInitialBody()];
    bodiesRef.current = next;
    draggingRef.current = null;
    lastRef.current = null;

    shipCollisionsRef.current = [];
    setShipCollisions([]);

    shipHpRef.current = SHIP_MAX_HP;
    shipInvulnUntilRef.current = 0;
    setShipHp(SHIP_MAX_HP);

    setGameStatus("playing");

    if (explosionTimeoutRef.current != null) {
      window.clearTimeout(explosionTimeoutRef.current);
      explosionTimeoutRef.current = null;
    }
    setShipExplosion(null);

    bulletsRef.current = [];
    setBullets([]);
    lastFireAtRef.current = 0;

    resetSpawning();
    resetLeveling();

    setBodies(next);
  }, [makeInitialBody, resetSpawning, resetLeveling]);

  const restartGame = useCallback(() => {
    setPaused(false);
    setScore(0);
    scoredDestroyedRef.current = new Set();
    reset();
  }, [reset]);

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
      const mass = Math.round(rand(1, 12));
      const radius = massToRadius(mass);

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
      if (b.destroyed) return;

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
      if (b.destroyed) return b;
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
      if (b.destroyed) return b;
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
        const now = performance.now();

        let next = bodiesRef.current.map((b) => {
          if (b.destroyed) return b;
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

        for (let i = 0; i < next.length; i++) {
          const b = next[i];
          if (b.destroyed) continue;
          const r = massToRadius(b.mass);
          if (b.radius !== r) next[i] = { ...b, radius: r };
        }

        const hitSet = new Set<string>();

        if (p.inside && shipHpRef.current > 0) {
          const shipR = SHIP_RADIUS;

          for (let i = 0; i < next.length; i++) {
            const b = next[i];
            if (b.destroyed) continue;
            if (draggingId && b.id === draggingId) continue;

            const dx = b.pos.x - p.x;
            const dy = b.pos.y - p.y;
            const rr = b.radius + shipR;

            if (dx * dx + dy * dy <= rr * rr) {
              hitSet.add(b.id);

              if (now >= shipInvulnUntilRef.current && shipHpRef.current > 0) {
                const prevHp = shipHpRef.current;
                const dmg = damageFromBody(b);
                const nextHp = clamp(prevHp - dmg, 0, SHIP_MAX_HP);

                shipHpRef.current = nextHp;
                shipInvulnUntilRef.current = now + SHIP_INVULN_MS;
                setShipHp(nextHp);

                if (prevHp > 0 && nextHp === 0) {
                  setGameStatus("gameover");
                  triggerShipExplosion({ x: p.x, y: p.y });
                }
              }
            }
          }
        }

        const hitIds = hitSet.size ? Array.from(hitSet) : [];

        if (!sameIds(shipCollisionsRef.current, hitIds)) {
          shipCollisionsRef.current = hitIds;
          setShipCollisions(hitIds);
        }

        if (hitSet.size) {
          let scoreDelta = 0;
          let destroyedNew = 0;

          for (const id of hitSet) {
            if (scoredDestroyedRef.current.has(id)) continue;

            const body = next.find((b) => b.id === id);
            if (!body) continue;

            scoredDestroyedRef.current.add(id);
            scoreDelta += Math.round(body.mass * 100);
            destroyedNew += 1;
          }

          if (scoreDelta > 0) {
            setScore((s) => s + scoreDelta);
          }

          if (destroyedNew > 0) {
            registerDestroyedBodies(destroyedNew);
          }

          next = next.map((b) => {
            if (!hitSet.has(b.id)) return b;
            if (b.destroyed) return b;
            return {
              ...b,
              destroyed: true,
              destroyedAt: now,
              vel: { x: 0, y: 0 },
            };
          });

          if (draggingRef.current && hitSet.has(draggingRef.current.id)) {
            draggingRef.current = null;
          }
        }

        if (bulletsRef.current.length) {
          const bds = boundsRef.current;
          const hitByBullet = new Set<string>();
          const bulletsNext: Bullet[] = [];

          let destroyedByBulletsNew = 0;

          for (const bullet of bulletsRef.current) {
            const ttl = bullet.ttl - dt;
            if (ttl <= 0) continue;

            const pos = {
              x: bullet.pos.x + bullet.vel.x * dt,
              y: bullet.pos.y + bullet.vel.y * dt,
            };

            const r = bullet.radius;
            if (
              pos.x < -r ||
              pos.y < -r ||
              pos.x > bds.w + r ||
              pos.y > bds.h + r
            )
              continue;

            let hit = false;

            for (let i = 0; i < next.length; i++) {
              const body = next[i];
              if (body.destroyed) continue;

              const dx = body.pos.x - pos.x;
              const dy = body.pos.y - pos.y;
              const rr = body.radius + r;

              if (dx * dx + dy * dy <= rr * rr) {
                hit = true;
                hitByBullet.add(body.id);

                if (!scoredDestroyedRef.current.has(body.id)) {
                  scoredDestroyedRef.current.add(body.id);
                  setScore((s) => s + Math.round(body.mass * 100));
                  destroyedByBulletsNew += 1;
                }

                next[i] = {
                  ...body,
                  destroyed: true,
                  destroyedAt: now,
                  vel: { x: 0, y: 0 },
                };

                break;
              }
            }

            if (!hit) {
              bulletsNext.push({ ...bullet, pos, ttl });
            }
          }

          if (destroyedByBulletsNew > 0) {
            registerDestroyedBodies(destroyedByBulletsNew);
          }

          if (draggingRef.current && hitByBullet.has(draggingRef.current.id)) {
            draggingRef.current = null;
          }

          bulletsRef.current = bulletsNext;
          setBullets(bulletsNext);
        }

        next = next.filter((b) => {
          if (!b.destroyed) return true;
          const at = b.destroyedAt ?? now;
          return now - at < EXPLOSION_DURATION;
        });

        if (
          gameStatusRef.current === "playing" &&
          shipHpRef.current > 0 &&
          bounds.w > 0 &&
          bounds.h > 0
        ) {
          const elapsedS = Math.max(
            0,
            (now - spawnStartedAtRef.current) / 1000,
          );
          let loops = 0;

          const lvl = levelRef.current;
          const maxActive = computeLevelMaxActiveBodies(lvl);

          while (
            loops < 4 &&
            now >= nextSpawnAtRef.current &&
            activeBodiesCount(next) < maxActive
          ) {
            const mass = computeSpawnMass(elapsedS);
            const radius = massToRadius(mass);

            const ship = {
              x: p.x,
              y: p.y,
              active: p.inside && shipHpRef.current > 0,
            };

            const pos = findSafeSpawnPos({
              bounds,
              bodies: next,
              radius,
              ship,
            });

            if (pos) {
              const vx = rand(-160, 160);
              const vy = rand(-160, 160);

              const newBody: Body = {
                id: uid(),
                pos,
                vel: { x: vx, y: vy },
                mass,
                radius,
                color: randColor(),
              };

              next = [...next, newBody];
            }

            const interval = computeSpawnIntervalMs(elapsedS);
            nextSpawnAtRef.current += interval;
            loops++;
          }
        }

        const active = next.filter((b) => !b.destroyed);
        solveCollisions(active);

        for (let i = 0; i < active.length; i++) {
          if (draggingId && active[i].id === draggingId) continue;
          collideWithBounds(active[i], bounds);
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
    triggerShipExplosion,
    computeSpawnIntervalMs,
    computeSpawnMass,
    computeLevelMaxActiveBodies,
    registerDestroyedBodies,
  ]);

  const shipDead = shipHp <= 0;
  const gameOver = gameStatus === "gameover";

  const spawnMaxBodies = SPAWN_MAX_BODIES;
  const levelMaxActiveBodies = computeLevelMaxActiveBodies(level);

  return {
    bodies,
    bodiesRef,

    bullets,
    bulletsRef,
    fireBullet,
    onPlayfieldPointerDown,

    boundsRef,
    setBounds,

    paused,
    setPaused,
    togglePause,
    reset,
    restartGame,

    addBody,
    removeLastBody,

    setPointer,

    gravityStrength,
    setGravityStrength,

    onBodyPointerDown,
    onPlayfieldPointerMove,
    onPlayfieldPointerUp,
    draggingId: draggingRef.current?.id ?? null,

    shipRadius: SHIP_RADIUS,
    shipCollisions,
    shipHit: !shipDead && shipCollisions.length > 0,

    shipHp,
    shipMaxHp: SHIP_MAX_HP,
    shipInvulnerable:
      !shipDead && performance.now() < shipInvulnUntilRef.current,

    shipDead,
    shipExplosion,

    score,
    gameStatus,
    gameOver,

    spawnMaxBodies,
    level,
    levelProgress,
    levelGoal,
    levelMaxActiveBodies,
  };
}
