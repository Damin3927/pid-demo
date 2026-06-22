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
                  ? 'bg-sky-600 text-white shadow-sm'
                  : isDone
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200',
              ].join(' ')}
            >
              <span
                className={[
                  'flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold',
                  isCurrent ? 'bg-white/25 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200',
                ].join(' ')}
              >
                {idx + 1}
              </span>
              {label}
            </button>
            {idx < labels.length - 1 && <span className="text-slate-300">→</span>}
          </div>
        )
      })}
    </nav>
  )
}
