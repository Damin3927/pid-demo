interface StepperProps {
  labels: string[]
  current: number
  onSelect: (index: number) => void
}

export function Stepper({ labels, current, onSelect }: StepperProps) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5">
      {labels.map((label, idx) => {
        const isCurrent = idx === current
        const isDone = idx < current
        return (
          <div key={label} className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelect(idx)}
              className={[
                'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition',
                isCurrent
                  ? 'bg-sky-500 text-slate-950'
                  : isDone
                    ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                    : 'bg-slate-800/70 text-slate-400 hover:bg-slate-700/70',
              ].join(' ')}
            >
              <span
                className={[
                  'flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold',
                  isCurrent ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-900/60 text-slate-300',
                ].join(' ')}
              >
                {idx + 1}
              </span>
              {label}
            </button>
            {idx < labels.length - 1 && <span className="text-slate-600">→</span>}
          </div>
        )
      })}
    </nav>
  )
}
