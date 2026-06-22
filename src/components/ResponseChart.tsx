import { useEffect, useRef } from 'react'
import { DEG } from '../sim/pid.ts'
import type { HistoryPoint } from '../sim/usePidSim.ts'

interface ResponseChartProps {
  history: HistoryPoint[]
  windowSeconds: number
}

function niceBound(value: number, step: number, up: boolean): number {
  return up ? Math.ceil(value / step) * step : Math.floor(value / step) * step
}

export function ResponseChart({ history, windowSeconds }: ResponseChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement!
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = parent.clientWidth
      const h = parent.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      sizeRef.current = { w, h, dpr }
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(parent)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { w, h, dpr } = sizeRef.current
    if (w === 0 || h === 0) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)

    const padL = 38
    const padR = 10
    const padT = 12
    const padB = 20
    const plotW = w - padL - padR
    const plotH = h - padT - padB

    const tEnd = history.length ? history[history.length - 1].t : 0
    const tStart = tEnd - windowSeconds

    let lo = Infinity
    let hi = -Infinity
    for (const p of history) {
      const deg = p.theta * DEG
      const tgt = p.target * DEG
      lo = Math.min(lo, deg, tgt)
      hi = Math.max(hi, deg, tgt)
    }
    if (!isFinite(lo)) {
      lo = -90
      hi = 90
    }
    lo = niceBound(lo - 8, 15, false)
    hi = niceBound(hi + 8, 15, true)
    if (hi - lo < 30) hi = lo + 30

    const xOf = (t: number) => padL + ((t - tStart) / windowSeconds) * plotW
    const yOf = (deg: number) => padT + (1 - (deg - lo) / (hi - lo)) * plotH

    // Grid + Y ticks.
    ctx.font = '10px system-ui, sans-serif'
    ctx.textBaseline = 'middle'
    for (let deg = lo; deg <= hi + 0.001; deg += 15) {
      const y = yOf(deg)
      ctx.strokeStyle = deg === 0 ? 'rgba(148,163,184,0.35)' : 'rgba(148,163,184,0.12)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padL, y)
      ctx.lineTo(w - padR, y)
      ctx.stroke()
      ctx.fillStyle = 'rgba(148,163,184,0.7)'
      ctx.textAlign = 'right'
      ctx.fillText(`${deg.toFixed(0)}`, padL - 6, y)
    }

    // Target line (dashed yellow).
    if (history.length > 1) {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)'
      ctx.setLineDash([5, 5])
      ctx.lineWidth = 2
      ctx.beginPath()
      history.forEach((p, idx) => {
        const x = xOf(p.t)
        const y = yOf(p.target * DEG)
        if (idx === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      ctx.setLineDash([])

      // Response line (cyan).
      ctx.strokeStyle = '#38bdf8'
      ctx.lineWidth = 2.5
      ctx.lineJoin = 'round'
      ctx.beginPath()
      history.forEach((p, idx) => {
        const x = xOf(p.t)
        const y = yOf(p.theta * DEG)
        if (idx === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
    } else {
      ctx.fillStyle = 'rgba(148,163,184,0.6)'
      ctx.textAlign = 'center'
      ctx.fillText('再生すると応答が表示されます', w / 2, h / 2)
    }

    // Axis labels.
    ctx.fillStyle = 'rgba(148,163,184,0.7)'
    ctx.textAlign = 'left'
    ctx.fillText('角度 [°]', padL - 34, padT - 2)
    ctx.textAlign = 'right'
    ctx.fillText('時間 →', w - padR, h - 8)
  }, [history, windowSeconds])

  return (
    <div className="relative h-[200px] w-full overflow-hidden rounded-xl bg-slate-950/60 ring-1 ring-white/5">
      <canvas ref={canvasRef} className="block" />
    </div>
  )
}
