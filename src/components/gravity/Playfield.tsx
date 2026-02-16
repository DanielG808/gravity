export default function Playfield() {
  return (
    <section className="relative flex-1 h-full overflow-hidden">
      <div className="absolute inset-0 bg-[#050510]" />

      <div className="absolute inset-0 opacity-70 [background:radial-gradient(1px_1px_at_20%_30%,rgba(255,255,255,0.6)_50%,transparent_60%),radial-gradient(1px_1px_at_70%_60%,rgba(255,255,255,0.5)_50%,transparent_60%),radial-gradient(1px_1px_at_40%_80%,rgba(255,255,255,0.35)_50%,transparent_60%),radial-gradient(1px_1px_at_85%_20%,rgba(255,255,255,0.45)_50%,transparent_60%),radial-gradient(1px_1px_at_10%_75%,rgba(255,255,255,0.4)_50%,transparent_60%)]" />

      <div className="absolute inset-0 opacity-60 [background:radial-gradient(800px_500px_at_30%_40%,rgba(124,58,237,0.18),transparent_60%),radial-gradient(700px_450px_at_70%_60%,rgba(59,130,246,0.14),transparent_60%)]" />

      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />

      <div className="relative h-full w-full">
        <div className="absolute left-6 top-6 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur-sm">
          Playfield
        </div>
      </div>
    </section>
  );
}
