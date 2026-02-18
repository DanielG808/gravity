"use client";

import * as React from "react";
import type { PlayfieldPointer } from "@/src/hooks/usePlayfieldPointer";
import PlayerShip from "./PlayerShip";

type PlayerShipFXProps = {
  pointer: PlayfieldPointer;
  hit: boolean;
  dead: boolean;
  explosion: { x: number; y: number } | null;
  paused: boolean;
};

export default function PlayerShipFX({
  pointer,
  hit,
  dead,
  explosion,
  paused,
}: PlayerShipFXProps) {
  return (
    <>
      {!dead ? <PlayerShip pointer={pointer} hit={hit} /> : null}

      {explosion ? (
        <div
          className="absolute pointer-events-none ship-explosion"
          style={{
            transform: `translate(${explosion.x}px, ${explosion.y}px)`,
            opacity: paused ? 0.9 : 1,
          }}
        >
          <div
            className="absolute ship-explosion-core"
            style={{
              width: 24 * 6,
              height: 24 * 6,
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(circle, rgba(255,235,170,0.98), rgba(255,110,60,0.72), rgba(255,40,0,0.0) 70%)",
              animation: "explode 420ms ease-out forwards",
            }}
          />
          <div
            className="absolute ship-explosion-ring"
            style={{
              width: 24 * 7,
              height: 24 * 7,
              transform: "translate(-50%, -50%)",
              borderColor: "rgba(255,210,140,0.85)",
              borderWidth: 2,
              borderStyle: "solid",
              borderRadius: 9999,
              animation: "shockwave 420ms ease-out forwards",
            }}
          />
        </div>
      ) : null}
    </>
  );
}
