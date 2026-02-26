"use client";

import { Body } from "@/src/hooks/gravitySim/types";
import * as React from "react";

type OrbProps = {
  body: Body;
  paused: boolean;
  blocked: boolean;
  toLocal: (
    e: React.PointerEvent,
  ) => { x: number; y: number; w: number; h: number } | null;
  applyPointer: (p: { x: number; y: number; inside: boolean }) => void;
  onBodyPointerDown: (
    id: string,
    at: { x: number; y: number },
  ) => (e: React.PointerEvent) => void;
};

export default function Orb({
  body,
  paused,
  blocked,
  toLocal,
  applyPointer,
  onBodyPointerDown,
}: OrbProps) {
  const exploding = Boolean(body.destroyed);

  if (exploding) {
    return (
      <div
        className="absolute pointer-events-none"
        style={{
          transform: `translate(${body.pos.x}px, ${body.pos.y}px)`,
          opacity: paused ? 0.9 : 1,
        }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: body.radius * 4,
            height: body.radius * 4,
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, rgba(255,220,140,0.95), rgba(255,90,40,0.65), rgba(255,40,0,0.0) 70%)",
            animation: "explode 420ms ease-out forwards",
          }}
        />
        <div
          className="absolute rounded-full border"
          style={{
            width: body.radius * 5,
            height: body.radius * 5,
            transform: "translate(-50%, -50%)",
            borderColor: "rgba(255,200,120,0.8)",
            borderWidth: 2,
            animation: "shockwave 420ms ease-out forwards",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="absolute rounded-full select-none cursor-grab active:cursor-grabbing"
      onPointerDown={(e) => {
        if (blocked) return;
        const p = toLocal(e);
        if (!p) return;
        applyPointer({ x: p.x, y: p.y, inside: true });
        onBodyPointerDown(body.id, { x: p.x, y: p.y })(e);
      }}
      style={{
        width: body.radius * 2,
        height: body.radius * 2,
        transform: `translate(${body.pos.x - body.radius}px, ${body.pos.y - body.radius}px)`,
        backgroundColor: body.color,
        boxShadow: `0 0 ${Math.max(10, body.radius * 1.5)}px ${body.color}`,
        opacity: paused ? 0.9 : 1,
      }}
    />
  );
}
