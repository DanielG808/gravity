"use client";

import type { PlayfieldPointer } from "@/src/hooks/usePlayfieldPointer";

type PlayerShipProps = {
  pointer: PlayfieldPointer;
};

export default function PlayerShip({ pointer }: PlayerShipProps) {
  if (!pointer.inside) return null;

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
          width: 46,
          height: 46,
          filter: "blur(10px)",
          opacity: 0.45,
          background:
            "radial-gradient(circle at 50% 50%, rgba(120,200,255,0.55), rgba(120,200,255,0.0) 70%)",
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      <svg
        width="30"
        height="30"
        viewBox="0 0 30 30"
        style={{ position: "relative" }}
      >
        <path
          d="M5 15 L24 9 L19 15 L24 21 Z"
          fill="rgba(255,255,255,0.9)"
          stroke="rgba(255,255,255,0.55)"
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
          background:
            "radial-gradient(circle at 70% 50%, rgba(140,240,255,0.92), rgba(140,240,255,0.0) 70%)",
          opacity: 0.9,
        }}
      />
    </div>
  );
}
