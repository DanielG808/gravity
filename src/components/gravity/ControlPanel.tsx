import Button from "@/src/components/ui/Button";

export default function ControlPanel() {
  return (
    <aside className="w-72 h-full border-l border-zinc-800 bg-zinc-900/60 p-4">
      <h2 className="text-sm font-semibold text-zinc-200">Controls</h2>

      <div className="mt-4 flex flex-col gap-2">
        <Button>Pause</Button>
        <Button>Reset</Button>
      </div>
    </aside>
  );
}
