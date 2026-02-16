import Button from "@/src/components/ui/Button";

type ControlPanelProps = {
  paused: boolean;
  onTogglePause: () => void;
  onReset: () => void;
  onAddBody: () => void;
  onRemoveBody: () => void;
  bodyCount: number;
};

export default function ControlPanel({
  paused,
  onTogglePause,
  onReset,
  onAddBody,
  onRemoveBody,
  bodyCount,
}: ControlPanelProps) {
  return (
    <aside className="w-72 h-full border-l border-zinc-800 bg-zinc-900/60 p-4">
      <h2 className="text-sm font-semibold text-zinc-200">Controls</h2>

      <div className="mt-1 text-xs text-zinc-400">{bodyCount} bodies</div>

      <div className="mt-4 flex flex-col gap-2">
        <Button onClick={onTogglePause}>{paused ? "Resume" : "Pause"}</Button>
        <Button onClick={onReset}>Reset</Button>

        <div className="h-px w-full bg-white/10 my-2" />

        <Button onClick={onAddBody}>Add Body</Button>
        <Button onClick={onRemoveBody} disabled={bodyCount <= 1}>
          Remove Body
        </Button>
      </div>
    </aside>
  );
}
