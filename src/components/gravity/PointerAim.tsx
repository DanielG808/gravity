"use client";

import type { Body } from "@/src/hooks/useGravitySim";

type Pointer = { x: number; y: number; inside: boolean };

type PointerAimProps = {
  pointer: Pointer;
  bodies: Body[];
};

export default function PointerAim({ pointer, bodies }: PointerAimProps) {
  if (!pointer.inside) return null;

  return (
    <svg className="absolute inset-0 pointer-events-none">
      <defs>
        <linearGradient id="aimGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="70%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="100%" stopColor="rgba(140,220,255,0.45)" />
        </linearGradient>
      </defs>

      {bodies.map((b) => (
        <line
          key={b.id}
          x1={b.pos.x}
          y1={b.pos.y}
          x2={pointer.x}
          y2={pointer.y}
          stroke="url(#aimGrad)"
          strokeWidth={1}
          strokeLinecap="round"
          opacity={0.9}
        />
      ))}
    </svg>
  );
}
