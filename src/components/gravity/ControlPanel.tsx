"use client";

import ControlPanelDivider from "../controls/ControlPanelDivider";
import ControlPanelHeader from "../controls/ControlPanelHeader";
import GravityMeter from "../controls/GravityMeter";
import PauseButton from "../controls/PauseButton";
import ScoreCounter from "../controls/ScoreCounter";
import CopyrightStatement from "../layout/CopyrightStatement";
import LevelCounter from "./LevelCounter";
import ShipHealthMeter from "./ShipHealthMeter";

type ControlPanelProps = {
  paused: boolean;
  onTogglePause: () => void;
  onReset: () => void;
  onAddBody: () => void;
  onRemoveBody: () => void;

  gravityStrength: number;
  onChangeGravityStrength: (v: number) => void;

  shipHP: number;
  shipMaxHP: number;
  shipInvulnerable?: boolean;

  score: number;
  gameOver: boolean;
  onRestart: () => void;

  bodyCount?: number;
  maxBodies?: number;

  level?: number;
  levelProgress?: number;
  levelGoal?: number;
  levelMaxActiveBodies?: number;
};

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export default function ControlPanel({
  paused,
  onTogglePause,
  onReset,
  onAddBody,
  onRemoveBody,
  gravityStrength,
  onChangeGravityStrength,
  shipHP,
  shipMaxHP,
  shipInvulnerable = false,

  score,
  gameOver,
  onRestart,

  bodyCount,
  maxBodies,

  level,
  levelProgress,
  levelGoal,
  levelMaxActiveBodies,
}: ControlPanelProps) {
  const pct = shipMaxHP > 0 ? clamp(shipHP / shipMaxHP, 0, 1) : 0;

  const bodiesLabel =
    typeof bodyCount === "number"
      ? typeof maxBodies === "number"
        ? `${bodyCount} / ${maxBodies}`
        : `${bodyCount}`
      : "—";

  const lvl = typeof level === "number" ? level : null;
  const prog = typeof levelProgress === "number" ? levelProgress : null;
  const goal = typeof levelGoal === "number" ? levelGoal : null;

  const levelPct =
    prog != null && goal != null && goal > 0 ? clamp(prog / goal, 0, 1) : 0;

  const gravityMin = 0;
  const gravityMax = 3;
  const gravityPct = clamp(
    (gravityStrength - gravityMin) / (gravityMax - gravityMin),
    0,
    1,
  );

  return (
    <aside className="relative w-[320px] shrink-0 h-full border-l border-white/10 bg-[#07071a]/70 backdrop-blur">
      <div className="absolute inset-0 pointer-events-none [background:radial-gradient(600px_500px_at_40%_20%,rgba(124,58,237,0.16),transparent_55%),radial-gradient(600px_500px_at_60%_80%,rgba(59,130,246,0.12),transparent_55%)]" />

      <section className="relative h-full flex flex-col p-4 gap-4">
        <ControlPanelHeader paused={paused} gameOver={gameOver} />

        <ScoreCounter score={score} />

        <LevelCounter
          lvl={lvl}
          prog={prog}
          goal={goal}
          levelPct={levelPct}
          levelMaxActiveBodies={levelMaxActiveBodies}
        />

        <ControlPanelDivider />

        <ShipHealthMeter
          pct={pct}
          shipHP={shipHP}
          shipMaxHP={shipMaxHP}
          shipInvulnerable={shipInvulnerable}
        />

        <ControlPanelDivider />

        <PauseButton
          paused={paused}
          gameOver={gameOver}
          onTogglePause={onTogglePause}
        />

        <ControlPanelDivider />

        <GravityMeter
          gravityStrength={gravityStrength}
          gravityPct={gravityPct}
          gravityMin={gravityMin}
          gravityMax={gravityMax}
        />

        <CopyrightStatement />
      </section>
    </aside>
  );
}
