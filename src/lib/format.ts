export function fmt(value: number, digits = 1): string {
  return value.toFixed(digits)
}

export function signed(value: number, digits = 1): string {
  const s = value.toFixed(digits)
  return value >= 0 ? `+${s}` : s
}
