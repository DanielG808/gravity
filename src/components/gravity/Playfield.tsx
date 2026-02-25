"use client";

import type { PointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Body, TBullet } from "@/src/hooks/useGravitySim";
import type { PlayfieldPointer } from "@/src/hooks/usePlayfieldPointer";
import PointerAim from "@/src/components/gravity/PointerAim";
import GameOverScreen from "./GameOverScreen";
import StartScreen from "./StartScreen";
import Orb from "./Orb";
import PlayerShipFX from "./PlayerShipFX";
import Bullet from "./Bullet";
import StarField from "./StarField";
import { useElementBounds } from "@/src/hooks/useElementBounds";

type PlayfieldProps = {
  paused: boolean;
  resetNonce: number;
  bodies: Body[];
  bullets: TBullet[];

  shipHit: boolean;
  shipDead: boolean;
  shipExplosion: { x: number; y: number } | null;

  onBoundsChange: (b: { w: number; h: number }) => void;
  onPointerChange: (p: { x: number; y: number; inside: boolean }) => void;

  onBodyPointerDown: (
    id: string,
    at: { x: number; y: number },
  ) => (e: PointerEvent) => void;

  onPlayfieldPointerMove: (at: { x: number; y: number }) => void;
  onPlayfieldPointerUp: () => void;

  onPlayfieldPointerDown: (at: {
    x: number;
    y: number;
  }) => (e: PointerEvent) => void;

  gameOver: boolean;
  onRestart: () => void;

  ready: boolean;
  onStart: () => void;
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
  bullets,
  shipHit,
  shipDead,
  shipExplosion,
  onBoundsChange,
  onPointerChange,
  onBodyPointerDown,
  onPlayfieldPointerMove,
  onPlayfieldPointerUp,
  onPlayfieldPointerDown,

  gameOver,
  onRestart,

  ready,
  onStart,
}: PlayfieldProps) {
  const ref = useRef<HTMLElement | null>(null);

  const { boundsRef } = useElementBounds({
    ref,
    resetNonce,
    onBoundsChange,
  });

  const [pointer, setPointer] = useState<PlayfieldPointer>({
    x: 0,
    y: 0,
    nx: 0,
    ny: 0,
    inside: false,
  });

  const [showGameOver, setShowGameOver] = useState(false);
  const gameOverTimeoutRef = useRef<number | null>(null);

  const hasStartedRef = useRef(false);
  const [showStart, setShowStart] = useState(false);

  useEffect(() => {
    if (gameOverTimeoutRef.current != null) {
      window.clearTimeout(gameOverTimeoutRef.current);
      gameOverTimeoutRef.current = null;
    }

    if (!gameOver) {
      setShowGameOver(false);
      return;
    }

    setShowGameOver(false);
    gameOverTimeoutRef.current = window.setTimeout(() => {
      setShowGameOver(true);
      gameOverTimeoutRef.current = null;
    }, 1000);

    return () => {
      if (gameOverTimeoutRef.current != null) {
        window.clearTimeout(gameOverTimeoutRef.current);
        gameOverTimeoutRef.current = null;
      }
    };
  }, [gameOver]);

  useEffect(() => {
    const shouldShow = ready && !gameOver && !hasStartedRef.current;
    setShowStart(shouldShow);
  }, [ready, gameOver]);

  const handleStart = useCallback(() => {
    hasStartedRef.current = true;
    setShowStart(false);
    onStart();
  }, [onStart]);

  const toLocal = useCallback((e: PointerEvent) => {
    const el = ref.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    return { x, y, w: r.width, h: r.height };
  }, []);

  const applyPointer = useCallback(
    (p: { x: number; y: number; inside: boolean }) => {
      const { w, h } = boundsRef.current;
      const next = toPointer(p.x, p.y, p.inside, w, h);
      setPointer(next);
      onPointerChange({ x: next.x, y: next.y, inside: next.inside });
    },
    [onPointerChange, boundsRef],
  );

  const blocked = gameOver || showStart;

  return (
    <section
      ref={ref}
      className={[
        "relative flex-1 h-full overflow-hidden bg-[#050510] touch-none",
        blocked ? "cursor-auto" : "cursor-none",
      ].join(" ")}
      onPointerDown={(e) => {
        if (blocked) return;
        const p = toLocal(e);
        if (!p) return;
        applyPointer({ x: p.x, y: p.y, inside: true });
        onPlayfieldPointerDown({ x: p.x, y: p.y })(e);
      }}
      onPointerMove={(e) => {
        if (blocked) return;
        const p = toLocal(e);
        if (!p) return;
        applyPointer({ x: p.x, y: p.y, inside: true });
        onPlayfieldPointerMove({ x: p.x, y: p.y });
      }}
      onPointerEnter={(e) => {
        if (blocked) return;
        const p = toLocal(e);
        if (!p) return;
        applyPointer({ x: p.x, y: p.y, inside: true });
      }}
      onPointerLeave={() => {
        applyPointer({ x: 0, y: 0, inside: false });
      }}
      onPointerUp={() => {
        if (blocked) return;
        onPlayfieldPointerUp();
      }}
      onPointerCancel={() => {
        if (blocked) return;
        onPlayfieldPointerUp();
      }}
    >
      <StarField />

      <div className="relative h-full w-full">
        <PointerAim pointer={pointer} bodies={bodies} />

        {bullets.map((b) => (
          <Bullet key={b.id} bullet={b} paused={paused} />
        ))}

        <PlayerShipFX
          pointer={pointer}
          hit={shipHit}
          dead={shipDead}
          explosion={shipExplosion}
          paused={paused}
        />

        {bodies.map((b) => (
          <Orb
            key={b.id}
            body={b}
            paused={paused}
            blocked={blocked}
            toLocal={toLocal}
            applyPointer={applyPointer}
            onBodyPointerDown={onBodyPointerDown}
          />
        ))}

        <StartScreen showStart={showStart} handleStart={handleStart} />

        <GameOverScreen
          gameOver={gameOver}
          showGameOver={showGameOver}
          onRestart={onRestart}
        />
      </div>
    </section>
  );
}
