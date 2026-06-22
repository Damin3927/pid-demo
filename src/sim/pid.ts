// Pure simulation core for a single-joint robot arm controlled by a PID law.
//
// The arm rotates about a pivot. `theta` is measured from the horizontal axis
// (0 = pointing right, +pi/2 = straight up, -pi/2 = hanging straight down) and
// is expressed in radians throughout this module.
//
// Equation of motion (rigid body about the pivot):
//
//   J * theta'' = tau_motor - b * theta' - m*g*L * cos(theta)
//
// The gravity term `m*g*L * cos(theta)` is the key to the lesson: it is a
// position-dependent load torque that does NOT vanish at the target angle, so a
// pure P (or PD) controller must hold a non-zero error to generate the matching
// torque. The integral term is what removes that steady-state error.

export interface Gains {
  kp: number
  ki: number
  kd: number
}

export interface PlantParams {
  /** Moment of inertia about the pivot [kg*m^2]. */
  inertia: number
  /** Viscous friction coefficient [N*m*s/rad]. */
  friction: number
  /** Gravity load coefficient m*g*L [N*m] — peak holding torque at horizontal. */
  gravity: number
  /** Actuator saturation: |tau_motor| <= maxTorque [N*m]. */
  maxTorque: number
}

export interface ArmState {
  theta: number
  omega: number
  /** Accumulated integral of the error [rad*s]. */
  integral: number
}

/** Per-step breakdown of the control torque, used for the live contribution bars. */
export interface TorqueTerms {
  p: number
  i: number
  d: number
  /** Unsaturated command (p + i + d). */
  command: number
  /** Actually applied torque after saturation. */
  applied: number
  saturated: boolean
}

export interface StepResult {
  state: ArmState
  terms: TorqueTerms
  error: number
}

export const DEG = 180 / Math.PI
export const RAD = Math.PI / 180

export function clamp(value: number, lo: number, hi: number): number {
  return value < lo ? lo : value > hi ? hi : value
}

/** Gravity load torque acting on the arm at the given angle. */
export function gravityTorque(plant: PlantParams, theta: number): number {
  return plant.gravity * Math.cos(theta)
}

/**
 * Advance the simulation by one fixed timestep using semi-implicit (symplectic)
 * Euler integration, which stays stable for the stiff, highly-damped gains this
 * demo allows.
 *
 * The derivative term acts on the measured angular velocity (derivative-on-
 * measurement) rather than on the raw error. With a piecewise-constant setpoint
 * these are identical except at the instant the target jumps, where measurement
 * derivative avoids the unbounded "derivative kick".
 */
export function step(
  state: ArmState,
  gains: Gains,
  plant: PlantParams,
  target: number,
  dt: number,
  antiWindup: boolean,
): StepResult {
  const error = target - state.theta

  let integral = state.integral + error * dt
  // Conditional integration: when anti-windup is on, never let the integral grow
  // past what the actuator can deliver, so it cannot "wind up" while saturated.
  if (antiWindup && gains.ki > 0) {
    const integralLimit = plant.maxTorque / gains.ki
    integral = clamp(integral, -integralLimit, integralLimit)
  }

  const p = gains.kp * error
  const i = gains.ki * integral
  const d = gains.kd * -state.omega
  const command = p + i + d
  const applied = clamp(command, -plant.maxTorque, plant.maxTorque)

  const angularAccel =
    (applied - plant.friction * state.omega - gravityTorque(plant, state.theta)) / plant.inertia

  const omega = state.omega + angularAccel * dt
  const theta = state.theta + omega * dt

  return {
    state: { theta, omega, integral },
    terms: { p, i, d, command, applied, saturated: command !== applied },
    error,
  }
}
