import { useEffect, useState } from 'react'
import { Stepper } from './components/Stepper.tsx'
import { PidLab } from './components/PidLab.tsx'
import { ControlLab } from './components/ControlLab.tsx'
import { STEPS } from './steps/steps.tsx'

const STORAGE_KEY = 'pid-demo-step'

function loadInitialStep(): number {
  const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  const idx = raw != null ? Number(raw) : 0
  return Number.isInteger(idx) && idx >= 0 && idx < STEPS.length ? idx : 0
}

export function App() {
  const [current, setCurrent] = useState(loadInitialStep)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(current))
  }, [current])

  const step = STEPS[current]
  const goTo = (idx: number) => setCurrent(Math.max(0, Math.min(STEPS.length - 1, idx)))

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">
          PID制御 インタラクティブ入門
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          ロボットアームで P → PD → PID、そしてインピーダンス／アドミタンス制御まで体験する
        </p>
      </header>

      <div className="mb-6">
        <Stepper labels={STEPS.map((s) => s.nav)} current={current} onSelect={goTo} />
      </div>

      <main>
        {step.kind === 'intro' ? (
          <div className="mx-auto max-w-2xl">
            <h2 className="text-xl font-bold text-slate-100">{step.title}</h2>
            <div className="mt-4 rounded-2xl bg-slate-900/50 p-6 ring-1 ring-white/5">
              {step.body}
            </div>
          </div>
        ) : step.kind === 'control' ? (
          <ControlLab key={step.id} step={step} />
        ) : (
          <PidLab key={step.id} step={step} />
        )}
      </main>

      <footer className="mt-8 flex items-center justify-between border-t border-white/5 pt-4">
        <button
          type="button"
          onClick={() => goTo(current - 1)}
          disabled={current === 0}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← 前へ
        </button>
        <span className="text-xs text-slate-500">
          {current + 1} / {STEPS.length}
        </span>
        <button
          type="button"
          onClick={() => goTo(current + 1)}
          disabled={current === STEPS.length - 1}
          className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {current === 0 ? 'はじめる' : '次へ'} →
        </button>
      </footer>
    </div>
  )
}
