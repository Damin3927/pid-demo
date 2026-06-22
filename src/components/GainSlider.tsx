import type { CSSProperties } from 'react'

interface GainSliderProps {
  symbol: string
  name: string
  description: string
  value: number
  min: number
  max: number
  step: number
  color: string
  disabled?: boolean
  onChange: (value: number) => void
}

export function GainSlider({
  symbol,
  name,
  description,
  value,
  min,
  max,
  step,
  color,
  disabled,
  onChange,
}: GainSliderProps) {
  return (
    <div className={disabled ? 'opacity-50' : ''}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-base font-bold" style={{ color }}>
            {symbol}
          </span>
          <span className="text-sm text-slate-700">{name}</span>
        </div>
        <span className="font-mono text-sm tabular-nums text-slate-900">{value.toFixed(1)}</span>
      </div>
      <input
        type="range"
        className="w-full"
        style={{ '--thumb': color } as CSSProperties}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
    </div>
  )
}
