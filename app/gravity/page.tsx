"use client";

import * as React from "react";
import ControlPanel from "@/src/components/gravity/ControlPanel";
import Playfield from "@/src/components/gravity/Playfield";
import { useGravitySim } from "@/src/hooks/useGravitySim";

export default function GravityPage() {
  const sim = useGravitySim({
    initialPos: { x: 0, y: 0 },
    initialVel: { x: 0, y: 0 },
  });

  const [resetNonce, setResetNonce] = React.useState(0);
  const [bounds, setBounds] = React.useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });

  const onReset = React.useCallback(() => {
    sim.setPaused(false);
    sim.reset();
    setResetNonce((n) => n + 1);
  }, [sim]);

  const onAddBody = React.useCallback(() => {
    sim.addBody(bounds.w && bounds.h ? bounds : undefined);
  }, [sim, bounds]);

  const onRemoveBody = React.useCallback(() => {
    sim.removeLastBody();
  }, [sim]);

  return (
    <main className="w-screen h-screen overflow-hidden text-white">
      <div className="relative w-full h-full flex">
        <div className="absolute inset-0 pointer-events-none [background:radial-gradient(900px_600px_at_20%_30%,rgba(59,130,246,0.10),transparent_60%),radial-gradient(900px_600px_at_80%_70%,rgba(124,58,237,0.10),transparent_60%)]" />

        <Playfield
          paused={sim.paused}
          resetNonce={resetNonce}
          bodies={sim.bodies}
          onBoundsChange={setBounds}
          onPointerChange={sim.setPointer}
        />

        <ControlPanel
          paused={sim.paused}
          onTogglePause={sim.togglePause}
          onReset={onReset}
          onAddBody={onAddBody}
          onRemoveBody={onRemoveBody}
          bodyCount={sim.bodies.length}
        />
      </div>
    </main>
  );
}
