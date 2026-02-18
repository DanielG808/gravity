"use client";

import ControlPanelDivider from "../controls/ControlPanelDivider";
import GravityMeter from "../controls/GravityMeter";
import PauseButton from "../controls/PauseButton";
import CopyrightStatement from "../layout/CopyrightStatement";

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

      <div className="relative h-full flex flex-col p-4 gap-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs tracking-[0.25em] uppercase text-white/60">
              Gravity Lab
            </div>
            <div className="text-lg font-semibold text-white/90">
              Control Panel
            </div>
          </div>

          <div
            className={[
              "text-xs px-2 py-1 rounded-md border",
              gameOver
                ? "border-rose-300/30 text-rose-200/90 bg-rose-400/10"
                : paused
                  ? "border-amber-300/30 text-amber-200/90 bg-amber-400/10"
                  : "border-emerald-300/25 text-emerald-200/90 bg-emerald-400/10",
            ].join(" ")}
          >
            {gameOver ? "Game Over" : paused ? "Paused" : "Running"}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs tracking-[0.25em] uppercase text-white/60">
              Score
            </div>
            <div className="mt-1 text-2xl font-semibold text-white/90">
              {score}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs tracking-[0.25em] uppercase text-white/60">
              Bodies
            </div>
            <div className="mt-1 text-2xl font-semibold text-white/90">
              {bodiesLabel}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs tracking-[0.25em] uppercase text-white/60">
              Level
            </div>
            <div className="text-xs font-mono text-white/80">
              {lvl != null ? `Lv ${lvl}` : "—"}
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] text-white/45 font-mono">
            <span>{prog != null ? prog : "—"}</span>
            <span>{goal != null ? goal : "—"}</span>
          </div>

          <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full transition-[width] duration-150 bg-cyan-300/70"
              style={{ width: `${levelPct * 100}%` }}
            />
          </div>

          <div className="mt-2 text-[10px] text-white/45 font-mono">
            Max active bodies:{" "}
            {typeof levelMaxActiveBodies === "number"
              ? levelMaxActiveBodies
              : "—"}
          </div>
        </div>

        <ControlPanelDivider />

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs tracking-[0.25em] uppercase text-white/60">
              Ship HP
            </div>

            <div
              className={[
                "text-xs font-mono text-white/80",
                shipInvulnerable ? "text-cyan-200/90" : "",
              ].join(" ")}
            >
              {shipHP} / {shipMaxHP}
            </div>
          </div>

          <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={[
                "h-full transition-[width] duration-150",
                shipInvulnerable ? "bg-cyan-300/70" : "bg-rose-400/80",
              ].join(" ")}
              style={{ width: `${pct * 100}%` }}
            />
          </div>

          <div className="mt-2 flex justify-between text-[10px] text-white/40 font-mono">
            <span>0</span>
            <span>{shipMaxHP}</span>
          </div>
        </div>

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
      </div>
    </aside>
  );
}
