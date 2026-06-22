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

// --- Impedance / admittance chapter ---

export const CONTROL_GAIN_RANGES = {
  /** Virtual spring stiffness K [N*m/rad] (impedance). */
  stiffness: { min: 2, max: 40, step: 0.5 },
  /** Virtual damper D [N*m*s/rad] (impedance). */
  damping: { min: 0, max: 8, step: 0.1 },
  /** Rendered inertia Mv [kg*m^2] (admittance). */
  virtualMass: { min: 0.1, max: 1.5, step: 0.1 },
  /** Rendered damping Dv [N*m*s/rad] (admittance). */
  virtualDamping: { min: 0, max: 4, step: 0.1 },
}

// Sustained external torque the user leans on the arm with [N*m]. Impedance
// never measures it; admittance does — that contrast is the whole lesson.
export const EXTERNAL_TORQUE_RANGE = { min: -4, max: 4, step: 0.1 }

// Stiff inner position loop used by the admittance controller. Kept high so the
// arm tracks the virtual reference rigidly and the rendered mass feel is clean.
export const ADMITTANCE_INNER = { kp: 60, kd: 8 }

// Virtual spring that pulls the admittance reference back to the target, so the
// chapter still has a setpoint to step toward like the others.
export const ADMITTANCE_VIRTUAL_STIFFNESS = 4 // Kv [N*m/rad]
