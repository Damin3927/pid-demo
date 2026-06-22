import type { CSSProperties, ReactNode } from 'react'
import { signed } from '../lib/format.ts'

interface ControlSimControlsProps {
  targetDeg: number
  targetMinDeg: number
  targetMaxDeg: number
  onTargetDeg: (deg: number) => void
  external: number
  externalMin: number
  externalMax: number
  externalStep: number
  onExternal: (value: number) => void
  measuresForce: boolean
  running: boolean
  onToggleRunning: () => void
  onReset: () => void
  onKick: () => void
  slowMo: boolean
  onToggleSlowMo: () => void
  gravityComp: boolean
  onToggleGravityComp: () => void
}

function Btn({
  children,
  onClick,
  primary,
}: {
  children: ReactNode
  onClick: () => void
  primary?: boolean
}) {
  const base =
    'rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95 ring-1 ring-white/10'
  const style = primary
    ? 'bg-sky-500/90 text-slate-950 hover:bg-sky-400'
    : 'bg-slate-700/70 text-slate-100 hover:bg-slate-600/70'
  return (
    <button type="button" className={`${base} ${style}`} onClick={onClick}>
      {children}
    </button>
  )
}

export function ControlSimControls({
  targetDeg,
  targetMinDeg,
  targetMaxDeg,
  onTargetDeg,
  external,
  externalMin,
  externalMax,
  externalStep,
  onExternal,
  measuresForce,
  running,
  onToggleRunning,
  onReset,
  onKick,
  slowMo,
  onToggleSlowMo,
  gravityComp,
  onToggleGravityComp,
}: ControlSimControlsProps) {
  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm text-slate-300">目標角度</span>
          <span className="font-mono text-sm tabular-nums text-amber-300">
            {targetDeg.toFixed(0)}°
          </span>
        </div>
        <input
          type="range"
          className="w-full"
          style={{ '--thumb': '#facc15' } as CSSProperties}
          min={targetMinDeg}
          max={targetMaxDeg}
          step={1}
          value={targetDeg}
          onChange={(e) => onTargetDeg(Number(e.target.value))}
        />
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm text-slate-300">
            外力（押す力）
            <span className="ml-1 text-xs text-slate-500">
              {measuresForce ? 'センサで計測 → 制御に使う' : '制御は計測しない'}
            </span>
          </span>
          <span className="font-mono text-sm tabular-nums text-orange-300">
            {signed(external, 1)} N·m
          </span>
        </div>
        <input
          type="range"
          className="w-full"
          style={{ '--thumb': '#fb923c' } as CSSProperties}
          min={externalMin}
          max={externalMax}
          step={externalStep}
          value={external}
          onChange={(e) => onExternal(Number(e.target.value))}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Btn onClick={onToggleRunning} primary>
          {running ? '⏸ 一時停止' : '▶ 再生'}
        </Btn>
        <Btn onClick={onReset}>↺ リセット</Btn>
        <Btn onClick={() => onExternal(0)}>🖐 手を離す</Btn>
        <Btn onClick={onKick}>👋 小突く</Btn>
        <Btn onClick={onToggleSlowMo}>{slowMo ? '🐢 0.3倍速' : '⏱ 等速'}</Btn>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          className="h-4 w-4 accent-emerald-400"
          checked={gravityComp}
          onChange={onToggleGravityComp}
        />
        重力補償を有効にする
      </label>
    </div>
  )
}
