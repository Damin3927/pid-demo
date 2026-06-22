import { type PlantParams, RAD } from './pid.ts'

// Tuned so that the lesson is visible by default:
//  - low natural damping -> P alone rings noticeably
//  - meaningful gravity load -> P / PD leave a clear steady-state droop
export const DEFAULT_PLANT: PlantParams = {
  inertia: 0.2,
  friction: 0.12,
  gravity: 2.2,
  maxTorque: 6,
}

export const INITIAL_THETA = -90 * RAD // arm starts hanging straight down

export const TARGET_RANGE = { min: 0, max: 85, default: 60 }

export const GAIN_RANGES = {
  kp: { min: 0, max: 40, step: 0.5 },
  ki: { min: 0, max: 30, step: 0.5 },
  kd: { min: 0, max: 8, step: 0.1 },
}

export const HISTORY_WINDOW_SECONDS = 8

export const KICK_DEG = 35 // angular-velocity impulse applied by the disturbance button
