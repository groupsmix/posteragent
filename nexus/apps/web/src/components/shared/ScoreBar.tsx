import { cn } from "@/lib/utils";

export function ScoreBar({ value, max = 10, label, className = "" }: { value: number; max?: number; label?: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const tone = value >= 8 ? "bg-success" : value >= 6 ? "bg-warning" : "bg-destructive";
  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground capitalize">{label.replace(/_/g, " ")}</span>
          <span className="font-mono tabular-nums font-medium">{value.toFixed(1)}</span>
        </div>
      )}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
