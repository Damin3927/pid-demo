import { type ReactNode, useRef, useState } from 'react'
import { DEG, RAD } from '../sim/pid.ts'
import type { ControlGains } from '../sim/control.ts'
import { useControlSim, type ControlConfig } from '../sim/useControlSim.ts'
import {
  CONTROL_GAIN_RANGES,
  DEFAULT_PLANT,
  EXTERNAL_TORQUE_RANGE,
  HISTORY_WINDOW_SECONDS,
  INITIAL_THETA,
  KICK_DEG,
  TARGET_RANGE,
} from '../sim/config.ts'
import type { ControlStep } from '../steps/steps.tsx'
import { ArmCanvas } from './ArmCanvas.tsx'
import { ResponseChart } from './ResponseChart.tsx'
import { GainSlider } from './GainSlider.tsx'
import { ControlTermBar } from './ControlTermBar.tsx'
import { MetricCard } from './MetricCard.tsx'
import { ControlSimControls } from './ControlSimControls.tsx'
import { signed } from '../lib/format.ts'

function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-900/50 p-4 ring-1 ring-white/5">
      {title && <h3 className="mb-3 text-sm font-semibold text-slate-200">{title}</h3>}
      {children}
    </div>
  )
}

interface SliderSpec {
  key: keyof ControlGains
  symbol: string
  name: string
  description: string
  color: string
  range: { min: number; max: number; step: number }
}

const SLIDERS: SliderSpec[] = [
  {
    key: 'stiffness',
    symbol: 'K',
    name: '剛性（仮想バネ）',
    description: '硬さ。大きいほど押しても動かず、小さいほど柔らかく従う（コンプライアンス）。',
    color: '#38bdf8',
    range: CONTROL_GAIN_RANGES.stiffness,
  },
  {
    key: 'damping',
    symbol: 'D',
    name: '減衰（仮想ダンパ）',
    description: '動きにかけるブレーキ。振動を抑えて落ち着かせる。',
    color: '#c084fc',
    range: CONTROL_GAIN_RANGES.damping,
  },
  {
    key: 'virtualMass',
    symbol: 'Mv',
    name: '仮想質量',
    description: '感じさせたい重さ。小さいほど軽く動かせ、大きいほど重く鈍い。',
    color: '#f472b6',
    range: CONTROL_GAIN_RANGES.virtualMass,
  },
  {
    key: 'virtualDamping',
    symbol: 'Dv',
    name: '仮想減衰',
    description: '感じさせたい粘り。大きいほど手応えが重く、動きがすぐ止まる。',
    color: '#fbbf24',
    range: CONTROL_GAIN_RANGES.virtualDamping,
  },
]

export function ControlLab({ step }: { step: ControlStep }) {
  const [gains, setGains] = useState<ControlGains>(step.defaults)
  const [targetDeg, setTargetDeg] = useState(TARGET_RANGE.default)
  const [external, setExternal] = useState(0)
  const [gravityComp, setGravityComp] = useState(step.gravityComp)
  const [running, setRunning] = useState(true)
  const [slowMo, setSlowMo] = useState(false)
  const kickSign = useRef(-1)

  const config: ControlConfig = {
    mode: step.mode,
    gains,
    plant: DEFAULT_PLANT,
    target: targetDeg * RAD,
    gravityComp,
    external,
    running,
    timeScale: slowMo ? 0.3 : 1,
    initialTheta: INITIAL_THETA,
  }

  const { snapshot, history, reset, kick } = useControlSim(config)
  const { metrics } = snapshot

  const setGain = (key: keyof ControlGains) => (value: number) =>
    setGains((g) => ({ ...g, [key]: value }))

  const errorDeg = snapshot.error * DEG
  const sliders = SLIDERS.filter((s) => step.active[s.key])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-100">{step.title}</h2>
        <p className="mt-1 text-sm text-slate-400">{step.lead}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <ArmCanvas
            theta={snapshot.theta}
            target={snapshot.target}
            applied={snapshot.terms.applied}
            maxTorque={DEFAULT_PLANT.maxTorque}
            saturated={snapshot.terms.saturated}
            external={snapshot.external}
          />
          <ResponseChart history={history} windowSeconds={HISTORY_WINDOW_SECONDS} />
          <Card>
            <ControlSimControls
              targetDeg={targetDeg}
              targetMinDeg={TARGET_RANGE.min}
              targetMaxDeg={TARGET_RANGE.max}
              onTargetDeg={setTargetDeg}
              external={external}
              externalMin={EXTERNAL_TORQUE_RANGE.min}
              externalMax={EXTERNAL_TORQUE_RANGE.max}
              externalStep={EXTERNAL_TORQUE_RANGE.step}
              onExternal={setExternal}
              measuresForce={step.mode === 'admittance'}
              running={running}
              onToggleRunning={() => setRunning((r) => !r)}
              onReset={() => {
                setExternal(0)
                reset()
              }}
              onKick={() => {
                kick(kickSign.current * KICK_DEG)
                kickSign.current *= -1
              }}
              slowMo={slowMo}
              onToggleSlowMo={() => setSlowMo((s) => !s)}
              gravityComp={gravityComp}
              onToggleGravityComp={() => setGravityComp((g) => !g)}
            />
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <Card>
            <div className="text-sm leading-relaxed text-slate-300">{step.body}</div>
          </Card>

          <Card title="つまみ調整">
            <div className="space-y-4">
              {sliders.map((s) => (
                <GainSlider
                  key={s.key}
                  symbol={s.symbol}
                  name={s.name}
                  description={s.description}
                  value={gains[s.key]}
                  min={s.range.min}
                  max={s.range.max}
                  step={s.range.step}
                  color={s.color}
                  onChange={setGain(s.key)}
                />
              ))}
            </div>
          </Card>

          <Card>
            <ControlTermBar
              terms={snapshot.terms}
              maxTorque={DEFAULT_PLANT.maxTorque}
              mode={step.mode}
              gravityComp={gravityComp}
            />
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              label="現在の誤差"
              value={signed(errorDeg, 1)}
              unit="°"
              tone={Math.abs(errorDeg) < 1 ? 'good' : 'default'}
            />
            <MetricCard
              label="定常偏差"
              value={metrics.steadyError != null ? signed(metrics.steadyError, 2) : '—'}
              unit={metrics.steadyError != null ? '°' : undefined}
              tone={
                metrics.steadyError != null
                  ? Math.abs(metrics.steadyError) < 0.5
                    ? 'good'
                    : 'warn'
                  : 'default'
              }
            />
            <MetricCard
              label="行き過ぎ"
              value={metrics.overshootPct != null ? metrics.overshootPct.toFixed(0) : '—'}
              unit={metrics.overshootPct != null ? '%' : undefined}
              tone={
                metrics.overshootPct != null && metrics.overshootPct > 10 ? 'warn' : 'default'
              }
            />
            <MetricCard
              label="整定時間"
              value={metrics.settleTime != null ? metrics.settleTime.toFixed(2) : '—'}
              unit={metrics.settleTime != null ? 's' : undefined}
              tone={metrics.settled ? 'good' : 'default'}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="🔧 試してみよう">
          <ul className="space-y-1.5 text-sm text-slate-300">
            {step.tryThis.map((t) => (
              <li key={t} className="flex gap-2">
                <span className="text-sky-400">›</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="👀 注目ポイント">
          <ul className="space-y-1.5 text-sm text-slate-300">
            {step.watchFor.map((t) => (
              <li key={t} className="flex gap-2">
                <span className="text-amber-400">›</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
