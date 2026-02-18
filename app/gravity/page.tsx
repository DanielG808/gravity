"use client";

import * as React from "react";
import ControlPanel from "@/src/components/gravity/ControlPanel";
import Playfield from "@/src/components/gravity/Playfield";
import { useGravitySim } from "@/src/hooks/useGravitySim";

export default function GravityPage() {
  const sim = useGravitySim({
    initialPos: { x: 420, y: 260 },
    initialVel: { x: 0, y: 0 },
  });

  const [resetNonce, setResetNonce] = React.useState(0);

  const activeBodyCount = React.useMemo(() => {
    let n = 0;
    for (const b of sim.bodies) if (!b.destroyed) n++;
    return n;
  }, [sim.bodies]);

  return (
    <main className="w-screen h-screen overflow-hidden text-white">
      <div className="relative w-full h-full flex">
        <div className="absolute inset-0 pointer-events-none [background:radial-gradient(900px_600px_at_20%_30%,rgba(59,130,246,0.10),transparent_60%),radial-gradient(900px_600px_at_80%_70%,rgba(124,58,237,0.10),transparent_60%)]" />

        <Playfield
          paused={sim.paused}
          resetNonce={resetNonce}
          bodies={sim.bodies}
          bullets={sim.bullets}
          shipHit={sim.shipHit}
          shipDead={sim.shipDead}
          shipExplosion={sim.shipExplosion}
          onBoundsChange={sim.setBounds}
          onPointerChange={sim.setPointer}
          onBodyPointerDown={sim.onBodyPointerDown}
          onPlayfieldPointerMove={sim.onPlayfieldPointerMove}
          onPlayfieldPointerUp={sim.onPlayfieldPointerUp}
          onPlayfieldPointerDown={sim.onPlayfieldPointerDown}
          ready={sim.ready}
          onStart={() => {
            sim.startGame();
            setResetNonce((n) => n + 1);
          }}
          gameOver={sim.gameOver}
          onRestart={() => {
            sim.restartGame();
            setResetNonce((n) => n + 1);
          }}
        />

        <ControlPanel
          paused={sim.paused}
          onTogglePause={sim.togglePause}
          onReset={() => {
            sim.reset();
            setResetNonce((n) => n + 1);
          }}
          onAddBody={() => sim.addBody(sim.boundsRef.current)}
          onRemoveBody={sim.removeLastBody}
          gravityStrength={sim.gravityStrength}
          onChangeGravityStrength={sim.setGravityStrength}
          shipHP={sim.shipHp}
          shipMaxHP={sim.shipMaxHp}
          shipInvulnerable={sim.shipInvulnerable}
          score={sim.score}
          gameOver={sim.gameOver}
          onRestart={() => {
            sim.restartGame();
            setResetNonce((n) => n + 1);
          }}
          bodyCount={activeBodyCount}
          maxBodies={sim.spawnMaxBodies}
          level={sim.level}
          levelProgress={sim.levelProgress}
          levelGoal={sim.levelGoal}
          levelMaxActiveBodies={sim.levelMaxActiveBodies}
        />
      </div>
    </main>
  );
}
