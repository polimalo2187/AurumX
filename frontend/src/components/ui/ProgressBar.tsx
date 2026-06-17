export function ProgressBar({ value, max }: { value: number; max: number }) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="h-3 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-aurum-gold to-aurum-amber transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
