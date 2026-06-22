import { useCallback, useEffect, useRef, useState } from 'react'
import {
  type ArmState,
  type Gains,
  type PlantParams,
  type TorqueTerms,
  DEG,
  RAD,
  step,
} from './pid.ts'

const SIM_DT = 0.002 // fixed integration step [s]
const MAX_FRAME_DT = 0.05 // clamp real-time gaps so tab refocus can't explode the sim
const HISTORY_SECONDS = 8
const SETTLE_BAND = 2 * RAD // |error| below this counts as "on target"
const SETTLE_OMEGA = 4 * RAD // and the arm must be nearly still

export interface Metrics {
  settled: boolean
  /** Steady-state error in degrees, populated once the response has settled. */
  steadyError: number | null
  /** Peak overshoot beyond the target as a percentage of the step size. */
  overshootPct: number | null
  /** Time from the last setpoint change to entering the settling band [s]. */
  settleTime: number | null
}

export interface SimSnapshot {
  theta: number
  omega: number
  error: number
  target: number
  time: number
  terms: TorqueTerms
  metrics: Metrics
}

export interface HistoryPoint {
  t: number
  theta: number
  target: number
}

export interface SimConfig {
  gains: Gains
  plant: PlantParams
  target: number
  antiWindup: boolean
  running: boolean
  /** Wall-clock to simulation time scale (1 = real time, 0.5 = slow motion). */
  timeScale: number
  /** Initial arm angle [rad], used on mount and on reset. */
  initialTheta: number
}

interface Episode {
  startTime: number
  startTheta: number
  target: number
  peakBeyond: number
  enteredBandAt: number | null
}

function newEpisode(time: number, theta: number, target: number): Episode {
  return { startTime: time, startTheta: theta, target, peakBeyond: 0, enteredBandAt: null }
}

function computeMetrics(ep: Episode, theta: number, omega: number): Metrics {
  const error = ep.target - theta
  const settled = Math.abs(error) < SETTLE_BAND && Math.abs(omega) < SETTLE_OMEGA
  const stepSize = ep.target - ep.startTheta
  const overshootPct =
    Math.abs(stepSize) > 1 * RAD ? (ep.peakBeyond / Math.abs(stepSize)) * 100 : null
  const settleTime = ep.enteredBandAt != null ? ep.enteredBandAt - ep.startTime : null
  return {
    settled,
    steadyError: settled ? error * DEG : null,
    overshootPct,
    settleTime,
  }
}

export function usePidSim(config: SimConfig) {
  const configRef = useRef(config)
  configRef.current = config

  const stateRef = useRef<ArmState>({ theta: config.initialTheta, omega: 0, integral: 0 })
  const episodeRef = useRef<Episode>(newEpisode(0, config.initialTheta, config.target))
  const historyRef = useRef<HistoryPoint[]>([])
  const simTimeRef = useRef(0)
  const lastTargetRef = useRef(config.target)
  const pendingKickRef = useRef(0)
  const lastTermsRef = useRef<TorqueTerms>({
    p: 0,
    i: 0,
    d: 0,
    command: 0,
    applied: 0,
    saturated: false,
  })

  const [snapshot, setSnapshot] = useState<SimSnapshot>(() => ({
    theta: config.initialTheta,
    omega: 0,
    error: config.target - config.initialTheta,
    target: config.target,
    time: 0,
    terms: { p: 0, i: 0, d: 0, command: 0, applied: 0, saturated: false },
    metrics: { settled: false, steadyError: null, overshootPct: null, settleTime: null },
  }))
  const [history, setHistory] = useState<HistoryPoint[]>([])

  const reset = useCallback(() => {
    const cfg = configRef.current
    stateRef.current = { theta: cfg.initialTheta, omega: 0, integral: 0 }
    simTimeRef.current = 0
    historyRef.current = []
    lastTargetRef.current = cfg.target
    episodeRef.current = newEpisode(0, cfg.initialTheta, cfg.target)
    setHistory([])
    setSnapshot({
      theta: cfg.initialTheta,
      omega: 0,
      error: cfg.target - cfg.initialTheta,
      target: cfg.target,
      time: 0,
      terms: { p: 0, i: 0, d: 0, command: 0, applied: 0, saturated: false },
      metrics: { settled: false, steadyError: null, overshootPct: null, settleTime: null },
    })
  }, [])

  const kick = useCallback((deltaDeg: number) => {
    pendingKickRef.current += deltaDeg * RAD
  }, [])

  useEffect(() => {
    let raf = 0
    let lastNow = performance.now()

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const cfg = configRef.current

      let frameDt = (now - lastNow) / 1000
      lastNow = now
      if (frameDt > MAX_FRAME_DT) frameDt = MAX_FRAME_DT

      // A setpoint change starts a fresh response episode for the metrics.
      if (cfg.target !== lastTargetRef.current) {
        lastTargetRef.current = cfg.target
        episodeRef.current = newEpisode(simTimeRef.current, stateRef.current.theta, cfg.target)
      }

      if (pendingKickRef.current !== 0) {
        stateRef.current = {
          ...stateRef.current,
          omega: stateRef.current.omega + pendingKickRef.current,
        }
        pendingKickRef.current = 0
      }

      let lastTerms = lastTermsRef.current
      if (cfg.running) {
        const simDt = frameDt * cfg.timeScale
        let acc = simDt
        while (acc > 1e-9) {
          const h = Math.min(SIM_DT, acc)
          acc -= h
          const result = step(
            stateRef.current,
            cfg.gains,
            cfg.plant,
            cfg.target,
            h,
            cfg.antiWindup,
          )
          stateRef.current = result.state
          lastTerms = result.terms
          simTimeRef.current += h

          const ep = episodeRef.current
          const direction = Math.sign(ep.target - ep.startTheta) || 1
          const beyond = (stateRef.current.theta - ep.target) * direction
          if (beyond > ep.peakBeyond) ep.peakBeyond = beyond
          const settledNow =
            Math.abs(ep.target - stateRef.current.theta) < SETTLE_BAND &&
            Math.abs(stateRef.current.omega) < SETTLE_OMEGA
          ep.enteredBandAt = settledNow ? (ep.enteredBandAt ?? simTimeRef.current) : null
        }
        lastTermsRef.current = lastTerms

        historyRef.current.push({
          t: simTimeRef.current,
          theta: stateRef.current.theta,
          target: cfg.target,
        })
        const cutoff = simTimeRef.current - HISTORY_SECONDS
        while (historyRef.current.length > 2 && historyRef.current[0].t < cutoff) {
          historyRef.current.shift()
        }
        setHistory(historyRef.current.slice())
      }

      const { theta, omega } = stateRef.current
      setSnapshot({
        theta,
        omega,
        error: cfg.target - theta,
        target: cfg.target,
        time: simTimeRef.current,
        terms: lastTerms,
        metrics: computeMetrics(episodeRef.current, theta, omega),
      })
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // The loop reads everything live from refs, so it only needs to start once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { snapshot, history, reset, kick }
}
