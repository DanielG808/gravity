"use client";

import { TBullet } from "@/src/hooks/gravitySim/types";

type BulletProps = {
  bullet: TBullet;
  paused: boolean;
};

export default function Bullet({ bullet, paused }: BulletProps) {
  const ang = Math.atan2(bullet.vel.y, bullet.vel.x) * (180 / Math.PI);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        transform: `translate(${bullet.pos.x}px, ${bullet.pos.y}px) rotate(${ang}deg)`,
        opacity: paused ? 0.9 : 1,
      }}
    >
      <div
        className="absolute rounded-full"
        style={{
          width: 18,
          height: 3,
          transform: "translate(-50%, -50%)",
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.95), rgba(34,211,238,0.95), rgba(34,211,238,0.0))",
          filter: "drop-shadow(0 0 10px rgba(34,211,238,0.65))",
        }}
      />
    </div>
  );
}
