/**
 * Generate unique access codes for newsletter recipients
 */

export function generateAccessCode(): string {
  // Generate a random 4-character hex string
  const part1 = Math.random().toString(16).substring(2, 6).toUpperCase()
  const part2 = Math.random().toString(16).substring(2, 6).toUpperCase()

  return `KEL-${part1}-${part2}`
}
