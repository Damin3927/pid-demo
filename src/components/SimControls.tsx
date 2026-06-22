import type { CSSProperties, ReactNode } from 'react'

interface SimControlsProps {
  targetDeg: number
  targetMinDeg: number
  targetMaxDeg: number
  onTargetDeg: (deg: number) => void
  running: boolean
  onToggleRunning: () => void
  onReset: () => void
  onKick: () => void
  slowMo: boolean
  onToggleSlowMo: () => void
  antiWindup?: { value: boolean; onChange: (value: boolean) => void }
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
    'rounded-lg px-3 py-2 text-sm font-medium transition active:scale-95 ring-1'
  const style = primary
    ? 'bg-sky-600 text-white ring-sky-700/10 hover:bg-sky-500'
    : 'bg-slate-100 text-slate-700 ring-slate-200 hover:bg-slate-200'
  return (
    <button type="button" className={`${base} ${style}`} onClick={onClick}>
      {children}
    </button>
  )
}

export function SimControls({
  targetDeg,
  targetMinDeg,
  targetMaxDeg,
  onTargetDeg,
  running,
  onToggleRunning,
  onReset,
  onKick,
  slowMo,
  onToggleSlowMo,
  antiWindup,
}: SimControlsProps) {
  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-sm text-slate-700">目標角度</span>
          <span className="font-mono text-sm tabular-nums text-amber-600">
            {targetDeg.toFixed(0)}°
          </span>
        </div>
        <input
          type="range"
          className="w-full"
          style={{ '--thumb': '#d97706' } as CSSProperties}
          min={targetMinDeg}
          max={targetMaxDeg}
          step={1}
          value={targetDeg}
          onChange={(e) => onTargetDeg(Number(e.target.value))}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Btn onClick={onToggleRunning} primary>
          {running ? '⏸ 一時停止' : '▶ 再生'}
        </Btn>
        <Btn onClick={onReset}>↺ リセット</Btn>
        <Btn onClick={onKick}>👋 外乱を加える</Btn>
        <Btn onClick={onToggleSlowMo}>{slowMo ? '🐢 0.3倍速' : '⏱ 等速'}</Btn>
      </div>

      {antiWindup && (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 accent-emerald-600"
            checked={antiWindup.value}
            onChange={(e) => antiWindup.onChange(e.target.checked)}
          />
          アンチワインドアップを有効にする
        </label>
      )}
    </div>
  )
}
