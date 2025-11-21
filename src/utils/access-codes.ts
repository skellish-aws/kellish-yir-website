/**
 * Generate unique access codes for newsletter recipients
 */

export function generateAccessCode(): string {
  // Generate a random 4-character hex string
  const part1 = Math.random().toString(16).substring(2, 6).toUpperCase()
  const part2 = Math.random().toString(16).substring(2, 6).toUpperCase()

  return `KEL-${part1}-${part2}`
}

/**
 * Access code format: KEL-XXXX-XXXX (case-insensitive)
 * Where XXXX is 4 alphanumeric characters
 */
export const ACCESS_CODE_REGEX = /^KEL-[A-Z0-9]{4}-[A-Z0-9]{4}$/i

/**
 * Validate access code format
 * @param code - Access code to validate
 * @returns true if format is valid
 */
export function validateAccessCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false
  }
  return ACCESS_CODE_REGEX.test(code.trim())
}

/**
 * Normalize access code (uppercase, remove spaces)
 * @param code - Access code to normalize
 * @returns Normalized access code
 */
export function normalizeAccessCode(code: string): string {
  if (!code || typeof code !== 'string') {
    return ''
  }
  return code.replace(/\s+/g, '').toUpperCase()
}

/**
 * Format access code input as user types (auto-format to KEL-XXXX-XXXX)
 * @param input - User input
 * @returns Formatted access code
 */
export function formatAccessCodeInput(input: string): string {
  if (!input) {
    return ''
  }

  // Remove all non-alphanumeric characters except KEL prefix
  const cleaned = input.replace(/[^A-Z0-9]/gi, '').toUpperCase()

  // If starts with KEL, format as KEL-XXXX-XXXX
  if (cleaned.startsWith('KEL')) {
    const afterKEL = cleaned.slice(3)
    const parts = afterKEL.match(/.{1,4}/g) || []
    if (parts.length === 0) {
      return 'KEL'
    } else if (parts.length === 1) {
      return `KEL-${parts[0]}`
    } else {
      return `KEL-${parts[0]}-${parts[1].slice(0, 4)}`
    }
  }

  // If doesn't start with KEL, just return cleaned (user might be typing KEL)
  return cleaned
}

/**
 * Extract access code from URL query parameter
 * @param url - URL string or URLSearchParams
 * @returns Access code if found, null otherwise
 */
export function extractAccessCodeFromUrl(url: string | URLSearchParams): string | null {
  let params: URLSearchParams

  if (typeof url === 'string') {
    try {
      const urlObj = new URL(url, window.location.origin)
      params = urlObj.searchParams
    } catch {
      // If not a full URL, try parsing as query string
      params = new URLSearchParams(url)
    }
  } else {
    params = url
  }

  const code = params.get('code')
  if (!code) {
    return null
  }

  const normalized = normalizeAccessCode(code)
  if (validateAccessCodeFormat(normalized)) {
    return normalized
  }

  return null
}
