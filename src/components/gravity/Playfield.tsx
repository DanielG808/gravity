"use client";

import type { PointerEvent } from "react";
import { useRef } from "react";
import type { Body, TBullet } from "@/src/hooks/useGravitySim";
import PointerAim from "@/src/components/gravity/PointerAim";
import GameOverScreen from "./GameOverScreen";
import StartScreen from "./StartScreen";
import Orb from "./Orb";
import PlayerShipFX from "./PlayerShipFX";
import Bullet from "./Bullet";
import StarField from "./StarField";
import { useElementBounds } from "@/src/hooks/useElementBounds";
import { usePlayfieldOverlays } from "@/src/hooks/usePlayfieldOverlays";
import { usePlayfieldPointer } from "@/src/hooks/usePlayfieldPointer";

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

  const { showStart, handleStart, showGameOver, blocked } =
    usePlayfieldOverlays({
      ready,
      gameOver,
      onStart,
      gameOverDelayMs: 1000,
    });

  const { pointer, toLocal, applyPointer, handlers } = usePlayfieldPointer({
    ref,
    boundsRef,
    blocked,
    onPointerChange,
    onPlayfieldPointerDown,
    onPlayfieldPointerMove,
    onPlayfieldPointerUp,
  });

  return (
    <section
      ref={ref}
      className={[
        "relative flex-1 h-full overflow-hidden bg-[#050510] touch-none",
        blocked ? "cursor-auto" : "cursor-none",
      ].join(" ")}
      {...handlers}
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
