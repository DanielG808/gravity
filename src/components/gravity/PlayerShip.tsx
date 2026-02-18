"use client";

import * as React from "react";
import type { PlayfieldPointer } from "@/src/hooks/usePlayfieldPointer";

type PlayerShipProps = {
  pointer: PlayfieldPointer;
  hit: boolean;
};

export default function PlayerShip({ pointer, hit }: PlayerShipProps) {
  const [flash, setFlash] = React.useState(false);
  const prevHitRef = React.useRef(false);
  const tRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const rising = hit && !prevHitRef.current;
    prevHitRef.current = hit;

    if (!rising) return;

    setFlash(true);

    if (tRef.current) window.clearTimeout(tRef.current);

    tRef.current = window.setTimeout(() => {
      setFlash(false);
      tRef.current = null;
    }, 500);
  }, [hit]);

  React.useEffect(() => {
    return () => {
      if (tRef.current) window.clearTimeout(tRef.current);
    };
  }, []);

  if (!pointer.inside) return null;

  const on = flash;

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: pointer.x,
        top: pointer.y,
        transform: "translate(-50%, -50%) rotate(90deg)",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          filter: on ? "blur(16px)" : "blur(10px)",
          opacity: on ? 0.9 : 0.45,
          background: on
            ? "radial-gradient(circle at 50% 50%, rgba(255,80,80,0.85), rgba(255,80,80,0.0) 70%)"
            : "radial-gradient(circle at 50% 50%, rgba(120,200,255,0.55), rgba(120,200,255,0.0) 70%)",
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          transition: "all 120ms ease-out",
        }}
      />

      <svg
        width="30"
        height="30"
        viewBox="0 0 30 30"
        style={{
          position: "relative",
          transform: on ? "scale(1.08)" : "scale(1)",
          transition: "transform 120ms ease-out",
        }}
      >
        <path
          d="M5 15 L24 9 L19 15 L24 21 Z"
          fill={on ? "rgba(255,120,120,0.95)" : "rgba(255,255,255,0.9)"}
          stroke={on ? "rgba(255,80,80,0.9)" : "rgba(255,255,255,0.55)"}
          strokeWidth="0.8"
        />
      </svg>

      <div
        style={{
          width: 16,
          height: 10,
          position: "absolute",
          left: -12,
          top: "50%",
          transform: "translateY(-50%)",
          background: on
            ? "radial-gradient(circle at 70% 50%, rgba(255,120,120,0.95), rgba(255,120,120,0.0) 70%)"
            : "radial-gradient(circle at 70% 50%, rgba(140,240,255,0.92), rgba(140,240,255,0.0) 70%)",
          opacity: on ? 1 : 0.9,
          transition: "all 120ms ease-out",
        }}
      />
    </div>
  );
}
