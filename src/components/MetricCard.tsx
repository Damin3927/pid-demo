interface MetricCardProps {
  label: string
  value: string
  unit?: string
  tone?: 'default' | 'good' | 'warn'
}

const TONES = {
  default: 'text-slate-100',
  good: 'text-emerald-300',
  warn: 'text-amber-300',
}

export function MetricCard({ label, value, unit, tone = 'default' }: MetricCardProps) {
  return (
    <div className="rounded-lg bg-slate-800/60 px-3 py-2 ring-1 ring-white/5">
      <div className="text-[11px] text-slate-400">{label}</div>
      <div className={`font-mono text-lg leading-tight tabular-nums ${TONES[tone]}`}>
        {value}
        {unit && <span className="ml-0.5 text-xs text-slate-500">{unit}</span>}
      </div>
    </div>
  )
}
