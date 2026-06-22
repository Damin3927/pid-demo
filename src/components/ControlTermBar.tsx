import type { ControlMode, ControlTerms } from '../sim/control.ts'
import { signed } from '../lib/format.ts'

interface ControlTermBarProps {
  terms: ControlTerms
  maxTorque: number
  mode: ControlMode
  gravityComp: boolean
}

const COLORS = {
  spring: '#38bdf8',
  damper: '#c084fc',
  gravity: '#34d399',
}

interface RowProps {
  label: string
  symbol: string
  value: number
  maxTorque: number
  color: string
  dim?: boolean
}

function Row({ label, symbol, value, maxTorque, color, dim }: RowProps) {
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
          <span className="text-slate-400">{label}</span>
        </span>
        <span className="font-mono tabular-nums text-slate-200">{signed(value, 2)}</span>
      </div>
      <div className="relative h-3 w-full rounded bg-slate-800">
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-600" />
        <div
          className="absolute top-0 bottom-0 rounded"
          style={{ left: `${leftPct}%`, width: `${widthPct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export function ControlTermBar({ terms, maxTorque, mode, gravityComp }: ControlTermBarProps) {
  const springLabel = mode === 'impedance' ? '仮想バネ K·(θd−θ)' : '内側ループ Kp'
  const damperLabel = mode === 'impedance' ? '仮想ダンパ −D·θ̇' : '内側ループ Kd'
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-semibold text-slate-200">トルクの内訳</h4>
        <span className="font-mono text-xs tabular-nums text-slate-400">
          合計 {signed(terms.applied, 2)} N·m
          {terms.saturated && <span className="ml-1 text-red-400">(飽和)</span>}
        </span>
      </div>
      <Row label={springLabel} symbol="K" value={terms.spring} maxTorque={maxTorque} color={COLORS.spring} />
      <Row label={damperLabel} symbol="D" value={terms.damper} maxTorque={maxTorque} color={COLORS.damper} />
      <Row
        label="重力補償 ĝ(θ)"
        symbol="g"
        value={terms.gravity}
        maxTorque={maxTorque}
        color={COLORS.gravity}
        dim={!gravityComp}
      />
    </div>
  )
}
