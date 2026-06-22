import { type ReactNode, useRef, useState } from 'react'
import { type Gains, DEG, RAD } from '../sim/pid.ts'
import { usePidSim, type SimConfig } from '../sim/usePidSim.ts'
import {
  DEFAULT_PLANT,
  GAIN_RANGES,
  HISTORY_WINDOW_SECONDS,
  INITIAL_THETA,
  KICK_DEG,
  TARGET_RANGE,
} from '../sim/config.ts'
import type { LabStep } from '../steps/steps.tsx'
import { ArmCanvas } from './ArmCanvas.tsx'
import { ResponseChart } from './ResponseChart.tsx'
import { GainSlider } from './GainSlider.tsx'
import { TermBar } from './TermBar.tsx'
import { MetricCard } from './MetricCard.tsx'
import { SimControls } from './SimControls.tsx'
import { signed } from '../lib/format.ts'

function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl bg-slate-900/50 p-4 ring-1 ring-white/5">
      {title && <h3 className="mb-3 text-sm font-semibold text-slate-200">{title}</h3>}
      {children}
    </div>
  )
}

export function PidLab({ step }: { step: LabStep }) {
  const [gains, setGains] = useState<Gains>(step.defaults)
  const [targetDeg, setTargetDeg] = useState(TARGET_RANGE.default)
  const [running, setRunning] = useState(true)
  const [slowMo, setSlowMo] = useState(false)
  const [antiWindup, setAntiWindup] = useState(true)
  const kickSign = useRef(-1)

  const config: SimConfig = {
    gains,
    plant: DEFAULT_PLANT,
    target: targetDeg * RAD,
    antiWindup,
    running,
    timeScale: slowMo ? 0.3 : 1,
    initialTheta: INITIAL_THETA,
  }

  const { snapshot, history, reset, kick } = usePidSim(config)
  const { metrics } = snapshot

  const setGain = (key: keyof Gains) => (value: number) =>
    setGains((g) => ({ ...g, [key]: value }))

  const errorDeg = snapshot.error * DEG

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
          />
          <ResponseChart history={history} windowSeconds={HISTORY_WINDOW_SECONDS} />
          <Card>
            <SimControls
              targetDeg={targetDeg}
              targetMinDeg={TARGET_RANGE.min}
              targetMaxDeg={TARGET_RANGE.max}
              onTargetDeg={setTargetDeg}
              running={running}
              onToggleRunning={() => setRunning((r) => !r)}
              onReset={reset}
              onKick={() => {
                kick(kickSign.current * KICK_DEG)
                kickSign.current *= -1
              }}
              slowMo={slowMo}
              onToggleSlowMo={() => setSlowMo((s) => !s)}
              antiWindup={
                step.antiWindup ? { value: antiWindup, onChange: setAntiWindup } : undefined
              }
            />
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <Card>
            <div className="text-sm leading-relaxed text-slate-300">{step.body}</div>
          </Card>

          <Card title="ゲイン調整">
            <div className="space-y-4">
              <GainSlider
                symbol="Kp"
                name="比例ゲイン"
                description="今の誤差に比例して押す力。大きいほど速いが振動しやすい。"
                value={gains.kp}
                min={GAIN_RANGES.kp.min}
                max={GAIN_RANGES.kp.max}
                step={GAIN_RANGES.kp.step}
                color="#38bdf8"
                disabled={!step.active.kp}
                onChange={setGain('kp')}
              />
              <GainSlider
                symbol="Ki"
                name="積分ゲイン"
                description="誤差を積み上げて押す力。定常偏差を消すが、強すぎると振動。"
                value={gains.ki}
                min={GAIN_RANGES.ki.min}
                max={GAIN_RANGES.ki.max}
                step={GAIN_RANGES.ki.step}
                color="#34d399"
                disabled={!step.active.ki}
                onChange={setGain('ki')}
              />
              <GainSlider
                symbol="Kd"
                name="微分ゲイン"
                description="動きの速さにかけるブレーキ。振動を抑える。"
                value={gains.kd}
                min={GAIN_RANGES.kd.min}
                max={GAIN_RANGES.kd.max}
                step={GAIN_RANGES.kd.step}
                color="#c084fc"
                disabled={!step.active.kd}
                onChange={setGain('kd')}
              />
            </div>
          </Card>

          <Card>
            <TermBar terms={snapshot.terms} maxTorque={DEFAULT_PLANT.maxTorque} active={step.active} />
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
