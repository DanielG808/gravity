"use client";

import * as React from "react";
import ControlPanel from "@/src/components/gravity/ControlPanel";
import Playfield from "@/src/components/gravity/Playfield";
import type { BodyState } from "@/src/lib/gravity/types";

export default function GravityPage() {
  return (
    <main className="w-screen h-screen overflow-hidden text-white">
      <div className="relative w-full h-full flex">
        <div className="absolute inset-0 pointer-events-none [background:radial-gradient(900px_600px_at_20%_30%,rgba(59,130,246,0.10),transparent_60%),radial-gradient(900px_600px_at_80%_70%,rgba(124,58,237,0.10),transparent_60%)]" />
        <Playfield />
        <ControlPanel />
      </div>
    </main>
  );
}
