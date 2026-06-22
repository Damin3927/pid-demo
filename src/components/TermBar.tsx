import type { TorqueTerms } from '../sim/pid.ts'
import { signed } from '../lib/format.ts'

interface TermBarProps {
  terms: TorqueTerms
  maxTorque: number
  active: { kp: boolean; ki: boolean; kd: boolean }
}

const COLORS = {
  p: '#0284c7',
  i: '#059669',
  d: '#7c3aed',
}

interface RowProps {
  label: string
  symbol: string
  value: number
  maxTorque: number
  color: string
  dim: boolean
}

function Row({ label, symbol, value, maxTorque, color, dim }: RowProps) {
  // Bars grow from the center: right = positive (lift), left = negative torque.
  const frac = Math.max(-1, Math.min(1, value / maxTorque))
  const widthPct = Math.abs(frac) * 50
  const leftPct = frac >= 0 ? 50 : 50 - widthPct
  return (
    <div className={dim ? 'opacity-40' : ''}>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span>
          <span className="font-mono font-bold" style={{ color }}>
            {symbol}
          </span>{' '}
          <span className="text-slate-500">{label}</span>
        </span>
        <span className="font-mono tabular-nums text-slate-800">{signed(value, 2)}</span>
      </div>
      <div className="relative h-3 w-full rounded bg-slate-100">
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-300" />
        <div
          className="absolute top-0 bottom-0 rounded"
          style={{ left: `${leftPct}%`, width: `${widthPct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export function TermBar({ terms, maxTorque, active }: TermBarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-semibold text-slate-800">トルクの内訳</h4>
        <span className="font-mono text-xs tabular-nums text-slate-500">
          合計 {signed(terms.applied, 2)} N·m
          {terms.saturated && <span className="ml-1 text-red-600">(飽和)</span>}
        </span>
      </div>
      <Row label="比例" symbol="P" value={terms.p} maxTorque={maxTorque} color={COLORS.p} dim={!active.kp} />
      <Row label="積分" symbol="I" value={terms.i} maxTorque={maxTorque} color={COLORS.i} dim={!active.ki} />
      <Row label="微分" symbol="D" value={terms.d} maxTorque={maxTorque} color={COLORS.d} dim={!active.kd} />
    </div>
  )
}
