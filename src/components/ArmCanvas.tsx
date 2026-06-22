import { useEffect, useRef } from 'react'
import { DEG } from '../sim/pid.ts'

interface ArmCanvasProps {
  theta: number
  target: number
  applied: number
  maxTorque: number
  saturated: boolean
  /** Sustained external torque the user leans on the arm with [N*m]. */
  external?: number
}

export function ArmCanvas({
  theta,
  target,
  applied,
  maxTorque,
  saturated,
  external = 0,
}: ArmCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 })

  // Keep the backing store sized to the element + device pixel ratio.
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

    const pivot = { x: w / 2, y: h * 0.52 }
    const armLen = Math.min(w * 0.36, h * 0.42)

    const tip = (angle: number) => ({
      x: pivot.x + armLen * Math.cos(angle),
      y: pivot.y - armLen * Math.sin(angle),
    })

    // Reference horizon (0deg) and a faint protractor.
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(pivot.x - armLen * 1.15, pivot.y)
    ctx.lineTo(pivot.x + armLen * 1.15, pivot.y)
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(pivot.x, pivot.y, armLen, -Math.PI, 0.001, true)
    ctx.stroke()

    // Target: ghost arm + tip marker.
    const tTip = tip(target)
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.55)'
    ctx.setLineDash([6, 6])
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(pivot.x, pivot.y)
    ctx.lineTo(tTip.x, tTip.y)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(250, 204, 21, 0.95)'
    ctx.beginPath()
    ctx.arc(tTip.x, tTip.y, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.font = '12px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(250, 204, 21, 0.95)'
    ctx.fillText(`目標 ${(target * DEG).toFixed(0)}°`, tTip.x + 10, tTip.y - 6)

    // Applied-torque arc at the pivot (sweep proportional to torque, sign = direction).
    const torqueFrac = Math.max(-1, Math.min(1, applied / maxTorque))
    if (Math.abs(torqueFrac) > 0.01) {
      ctx.strokeStyle = saturated ? '#f87171' : 'rgba(56, 189, 248, 0.85)'
      ctx.lineWidth = 5
      ctx.beginPath()
      const sweep = torqueFrac * Math.PI * 0.9
      ctx.arc(pivot.x, pivot.y, 30, -Math.PI / 2, -Math.PI / 2 - sweep, sweep > 0)
      ctx.stroke()
    }

    // Current arm.
    const cTip = tip(theta)
    const grad = ctx.createLinearGradient(pivot.x, pivot.y, cTip.x, cTip.y)
    grad.addColorStop(0, '#0ea5e9')
    grad.addColorStop(1, '#7dd3fc')
    ctx.strokeStyle = grad
    ctx.lineWidth = 10
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(pivot.x, pivot.y)
    ctx.lineTo(cTip.x, cTip.y)
    ctx.stroke()

    // Gravity hint at the tip.
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cTip.x, cTip.y)
    ctx.lineTo(cTip.x, cTip.y + 26)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cTip.x - 4, cTip.y + 20)
    ctx.lineTo(cTip.x, cTip.y + 26)
    ctx.lineTo(cTip.x + 4, cTip.y + 20)
    ctx.stroke()
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)'
    ctx.fillText('重力', cTip.x + 8, cTip.y + 24)

    // External push: a tangential arrow at the tip, length ~ applied force.
    // Positive external torque rotates the arm CCW (increasing theta).
    const extFrac = Math.max(-1, Math.min(1, external / maxTorque))
    if (Math.abs(extFrac) > 0.02) {
      const tan = { x: -Math.sin(theta), y: -Math.cos(theta) }
      const dir = Math.sign(extFrac)
      const len = 18 + Math.abs(extFrac) * 46
      const base = { x: cTip.x - tan.x * dir * len, y: cTip.y - tan.y * dir * len }
      const head = { x: cTip.x, y: cTip.y }
      ctx.strokeStyle = '#fb923c'
      ctx.fillStyle = '#fb923c'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(base.x, base.y)
      ctx.lineTo(head.x, head.y)
      ctx.stroke()
      const ang = Math.atan2(head.y - base.y, head.x - base.x)
      ctx.beginPath()
      ctx.moveTo(head.x, head.y)
      ctx.lineTo(head.x - 10 * Math.cos(ang - 0.4), head.y - 10 * Math.sin(ang - 0.4))
      ctx.lineTo(head.x - 10 * Math.cos(ang + 0.4), head.y - 10 * Math.sin(ang + 0.4))
      ctx.closePath()
      ctx.fill()
      ctx.font = '600 12px system-ui, sans-serif'
      ctx.fillText('外力', base.x - 6, base.y - 8)
    }

    // Tip joint + pivot hub.
    ctx.fillStyle = '#e0f2fe'
    ctx.beginPath()
    ctx.arc(cTip.x, cTip.y, 9, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1e293b'
    ctx.beginPath()
    ctx.arc(cTip.x, cTip.y, 4, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#475569'
    ctx.beginPath()
    ctx.arc(pivot.x, pivot.y, 14, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#0f172a'
    ctx.beginPath()
    ctx.arc(pivot.x, pivot.y, 6, 0, Math.PI * 2)
    ctx.fill()

    // Current angle readout.
    ctx.fillStyle = '#7dd3fc'
    ctx.font = '600 15px system-ui, sans-serif'
    ctx.fillText(`${(theta * DEG).toFixed(1)}°`, pivot.x + 18, pivot.y + 30)
  }, [theta, target, applied, maxTorque, saturated, external])

  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-xl bg-slate-950/60 ring-1 ring-white/5">
      <canvas ref={canvasRef} className="block" />
    </div>
  )
}
