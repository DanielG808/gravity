import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Body,
  Pointer,
  SimParams,
  UseGravitySimArgs,
  Vec2,
} from "./types";
import { clamp, mag, massToRadius, rand, uid } from "./math";
import { randColor } from "./colors";
import { collideWithBounds } from "./bounds";
import { solveCollisions } from "./collisions";
import { useShip } from "./ship";
import { useBullets } from "./bullets";
import { useDragging } from "./dragging";
import { useLeveling } from "./leveling";
import { activeBodiesCount, computeSpawnIntervalMs, spawnOne } from "./spawn";
import {
  EXPLOSION_DURATION,
  LEVEL_BASE_GOAL,
  SHIP_MAX_HP,
  SHIP_RADIUS,
  SPAWN_BASE_INTERVAL_MS,
  SPAWN_MAX_BODIES,
} from "./constants";

function loadGravityStrength() {
  if (typeof window === "undefined") return 1;
  const raw = window.localStorage.getItem("gravity:strength");
  const n = raw == null ? 1 : Number(raw);
  return Number.isFinite(n) ? n : 1;
}

function damageFromBody(b: Body) {
  return clamp(Math.round(b.mass * 2.6), 2, 40);
}

function sameIds(a: string[], b: string[]) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
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

  const setGameStatusSafe = useCallback((s: GameStatus) => {
    gameStatusRef.current = s;
    setGameStatus(s);
  }, []);

  const [ready, setReady] = useState(true);
  const readyRef = useRef(true);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    gameStatusRef.current = gameStatus;
  }, [gameStatus]);

  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

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

  const {
    draggingRef,
    draggingId,
    onBodyPointerDown,
    onPlayfieldPointerMove,
    onPlayfieldPointerUp,
    clearDraggingIf,
  } = useDragging({ bodiesRef, setBodies });

  const {
    shipHp,
    shipHpRef,
    shipInvulnUntilRef,
    shipExplosion,
    triggerShipExplosion,
    resetShip,
    applyShipDamage,
  } = useShip();

  const canFireRef = useRef(true);

  const { bullets, bulletsRef, fireBullet, resetBullets } = useBullets({
    pointerRef,
    readyRef,
    canFireRef,
  });

  const scoredDestroyedRef = useRef<Set<string>>(new Set());

  const {
    level,
    levelRef,
    levelProgress,
    levelGoal,
    computeLevelMaxActiveBodies,
    resetLeveling,
    registerDestroyedBodies,
  } = useLeveling();

  const [shipCollisions, setShipCollisions] = useState<string[]>([]);
  const shipCollisionsRef = useRef<string[]>([]);

  const lastRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const spawnStartedAtRef = useRef<number>(0);
  const nextSpawnAtRef = useRef<number>(0);

  const resetSpawning = useCallback(() => {
    const now = performance.now();
    spawnStartedAtRef.current = now;
    nextSpawnAtRef.current = now + SPAWN_BASE_INTERVAL_MS;
  }, []);

  const setPointer = useCallback((p: Pointer) => {
    pointerRef.current = p;
  }, []);

  const setBounds = useCallback((b: { w: number; h: number }) => {
    boundsRef.current = b;
  }, []);

  const startGame = useCallback(() => {
    if (!readyRef.current) return;
    readyRef.current = false;
    setReady(false);

    setGameStatusSafe("playing");
    setPaused(false);

    resetSpawning();
  }, [resetSpawning, setGameStatusSafe]);

  const reset = useCallback(() => {
    const next = [makeInitialBody()];
    bodiesRef.current = next;

    draggingRef.current = null;
    lastRef.current = null;

    shipCollisionsRef.current = [];
    setShipCollisions([]);

    resetShip();
    setGameStatusSafe("playing");

    resetBullets();
    resetSpawning();
    resetLeveling();

    setBodies(next);
  }, [
    makeInitialBody,
    draggingRef,
    resetShip,
    resetBullets,
    resetSpawning,
    resetLeveling,
    setGameStatusSafe,
  ]);

  const restartGame = useCallback(() => {
    setPaused(false);
    setScore(0);
    scoredDestroyedRef.current = new Set();
    reset();
  }, [reset]);

  useEffect(() => {
    reset();
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
  }, [draggingRef]);

  const onPlayfieldPointerDown = useCallback(
    (at: Vec2) => (e: React.PointerEvent) => {
      e.preventDefault();
      pointerRef.current = { x: at.x, y: at.y, inside: true };
      fireBullet();
    },
    [fireBullet],
  );

  useEffect(() => {
    const tick = (t: number) => {
      if (lastRef.current == null) lastRef.current = t;
      const dt = Math.min(0.05, (t - lastRef.current) / 1000);
      lastRef.current = t;

      if (!paused) {
        const p = pointerRef.current;
        const bounds = boundsRef.current;
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

              const dmg = damageFromBody(b);
              const res = applyShipDamage(now, dmg);

              if (res.died) {
                setGameStatusSafe("gameover");
                triggerShipExplosion({ x: p.x, y: p.y });
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

          if (scoreDelta > 0) setScore((s) => s + scoreDelta);
          if (destroyedNew > 0) registerDestroyedBodies(destroyedNew);

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

          clearDraggingIf(hitSet);
        }

        if (bulletsRef.current.length) {
          const bds = boundsRef.current;
          const hitByBullet = new Set<string>();
          const bulletsNext = [];
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

            if (!hit) bulletsNext.push({ ...bullet, pos, ttl });
          }

          if (destroyedByBulletsNew > 0)
            registerDestroyedBodies(destroyedByBulletsNew);

          clearDraggingIf(hitByBullet);

          bulletsRef.current = bulletsNext;
        }

        next = next.filter((b) => {
          if (!b.destroyed) return true;
          const at = b.destroyedAt ?? now;
          return now - at < EXPLOSION_DURATION;
        });

        if (
          !readyRef.current &&
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

          const maxActive = computeLevelMaxActiveBodies(levelRef.current);

          while (
            loops < 4 &&
            now >= nextSpawnAtRef.current &&
            activeBodiesCount(next) < maxActive
          ) {
            const nb = spawnOne({
              now,
              elapsedS,
              bounds,
              bodies: next,
              pointer: p,
              shipAlive: shipHpRef.current > 0,
            });

            if (nb) next = [...next, nb];

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
    draggingId,
    params.damping,
    params.g,
    params.maxSpeed,
    params.softening,
    gravityStrength,
    applyShipDamage,
    triggerShipExplosion,
    registerDestroyedBodies,
    computeLevelMaxActiveBodies,
    clearDraggingIf,
    setGameStatusSafe,
    bulletsRef,
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
    draggingId,

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

    ready,
    startGame,
  };
}
