// Pure simulation core for the impedance / admittance chapter.
//
// The plant is the *same* single-joint arm as the PID lessons (see pid.ts):
//
//   J * theta'' = tau_motor + tau_ext - b * theta' - m*g*L * cos(theta)
//
// Only the control law differs, and that difference is the whole point:
//
//   Impedance control — the robot is torque-controlled and renders a virtual
//   spring-damper about the target. It never measures the external torque; it
//   simply outputs a restoring torque from the measured displacement and
//   velocity. Push on it and it yields by ~tau_ext / K (Hooke's law).
//
//   Admittance control — the dual. The robot *measures* the external torque,
//   feeds it into a virtual mass-spring-damper whose motion becomes a reference
//   trajectory, then a stiff inner position loop tracks that reference. The arm
//   therefore *feels* like inertia Mv with damping Dv, whatever the real arm is.

import { type PlantParams, clamp, gravityTorque } from './pid.ts'
import { ADMITTANCE_INNER, ADMITTANCE_VIRTUAL_STIFFNESS } from './config.ts'

export type ControlMode = 'impedance' | 'admittance'

export interface ControlGains {
  /** Virtual spring stiffness K [N*m/rad] — impedance. */
  stiffness: number
  /** Virtual damper D [N*m*s/rad] — impedance. */
  damping: number
  /** Rendered inertia Mv [kg*m^2] — admittance. */
  virtualMass: number
  /** Rendered damping Dv [N*m*s/rad] — admittance. */
  virtualDamping: number
}

/** Physical arm state (no integrator — neither law uses one). */
export interface PlantState {
  theta: number
  omega: number
}

/** Admittance reference trajectory; unused (passthrough) in impedance mode. */
export interface ControlState {
  refTheta: number
  refOmega: number
}

/** Per-step torque breakdown for the live contribution bars. */
export interface ControlTerms {
  /** Spring-like torque: K*(theta_d - theta), or inner Kp*(theta_ref - theta). */
  spring: number
  /** Damper-like torque: -D*omega, or inner Kd*(omega_ref - omega). */
  damper: number
  /** Gravity-compensation feedforward (0 when disabled). */
  gravity: number
  command: number
  applied: number
  saturated: boolean
}

export interface ControlStepResult {
  state: PlantState
  ctrl: ControlState
  terms: ControlTerms
  error: number
}

/**
 * Advance the impedance/admittance simulation by one fixed timestep using
 * semi-implicit (symplectic) Euler, matching the PID core's integrator.
 *
 * `external` is the sustained user-applied torque [N*m]. It always acts on the
 * physical plant; only the admittance law also reads it as a sensed force.
 */
export function controlStep(
  mode: ControlMode,
  state: PlantState,
  ctrl: ControlState,
  gains: ControlGains,
  gravityComp: boolean,
  plant: PlantParams,
  target: number,
  external: number,
  dt: number,
): ControlStepResult {
  const gravity = gravityComp ? gravityTorque(plant, state.theta) : 0

  let spring: number
  let damper: number
  let nextCtrl = ctrl

  if (mode === 'impedance') {
    spring = gains.stiffness * (target - state.theta)
    damper = -gains.damping * state.omega
  } else {
    // Virtual mass-spring-damper driven by the *sensed* external torque. Its
    // motion is the reference the stiff inner loop chases.
    const refError = ctrl.refTheta - target
    const refAccel =
      (external - gains.virtualDamping * ctrl.refOmega - ADMITTANCE_VIRTUAL_STIFFNESS * refError) /
      gains.virtualMass
    const refOmega = ctrl.refOmega + refAccel * dt
    const refTheta = ctrl.refTheta + refOmega * dt
    nextCtrl = { refTheta, refOmega }
    spring = ADMITTANCE_INNER.kp * (refTheta - state.theta)
    damper = ADMITTANCE_INNER.kd * (refOmega - state.omega)
  }

  const command = spring + damper + gravity
  const applied = clamp(command, -plant.maxTorque, plant.maxTorque)

  const angularAccel =
    (applied + external - plant.friction * state.omega - gravityTorque(plant, state.theta)) /
    plant.inertia
  const omega = state.omega + angularAccel * dt
  const theta = state.theta + omega * dt

  return {
    state: { theta, omega },
    ctrl: nextCtrl,
    terms: { spring, damper, gravity, command, applied, saturated: command !== applied },
    error: target - state.theta,
  }
}
