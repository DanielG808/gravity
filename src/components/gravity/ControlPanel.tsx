"use client";

import * as React from "react";

type ControlPanelProps = {
  paused: boolean;
  onTogglePause: () => void;
  onReset: () => void;
  onAddBody: () => void;
  onRemoveBody: () => void;

  gravityStrength: number;
  onChangeGravityStrength: (v: number) => void;
};

export default function ControlPanel({
  paused,
  onTogglePause,
  onReset,
  onAddBody,
  onRemoveBody,
  gravityStrength,
  onChangeGravityStrength,
}: ControlPanelProps) {
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
              paused
                ? "border-amber-300/30 text-amber-200/90 bg-amber-400/10"
                : "border-emerald-300/25 text-emerald-200/90 bg-emerald-400/10",
            ].join(" ")}
          >
            {paused ? "Paused" : "Running"}
          </div>
        </div>

        <div className="h-px bg-white/10" />

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onTogglePause}
            className={[
              "w-full rounded-lg px-3 py-2 text-sm font-medium border transition",
              paused
                ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/15"
                : "border-amber-300/25 bg-amber-400/10 text-amber-100 hover:bg-amber-400/15",
            ].join(" ")}
          >
            {paused ? "Resume" : "Pause"}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="w-full rounded-lg px-3 py-2 text-sm font-medium border border-white/15 bg-white/5 text-white/90 hover:bg-white/10 transition"
          >
            Reset
          </button>
        </div>

        <div className="h-px bg-white/10" />

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onAddBody}
            className="w-full rounded-lg px-3 py-2 text-sm font-medium border border-cyan-300/25 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/15 transition"
          >
            Add Body
          </button>

          <button
            type="button"
            onClick={onRemoveBody}
            className="w-full rounded-lg px-3 py-2 text-sm font-medium border border-rose-300/25 bg-rose-400/10 text-rose-100 hover:bg-rose-400/15 transition"
          >
            Remove Body
          </button>
        </div>

        <div className="h-px bg-white/10" />

        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs tracking-[0.25em] uppercase text-white/60">
              Gravity Strength
            </div>
            <div className="text-xs font-mono text-white/80">
              {gravityStrength.toFixed(2)}x
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={3}
            step={0.01}
            value={gravityStrength}
            onChange={(e) => onChangeGravityStrength(Number(e.target.value))}
            className="mt-3 w-full accent-white"
          />

          <div className="mt-2 flex justify-between text-[10px] text-white/40 font-mono">
            <span>0.00</span>
            <span>3.00</span>
          </div>
        </div>

        <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-white/70 leading-relaxed">
            Bodies should bounce off the playfield edges once bounds are wired
            into the sim.
          </div>
        </div>
      </div>
    </aside>
  );
}
