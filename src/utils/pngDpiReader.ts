// src/utils/pngDpiReader.ts
// Read DPI/resolution metadata from PNG files

/**
 * Read DPI (dots per inch) from a PNG file
 * PNG files store resolution in the pHYs chunk
 *
 * @param file - PNG file to read
 * @returns Object with xDpi and yDpi, or null if not found/error
 */
export async function readPngDpi(file: File): Promise<{ xDpi: number; yDpi: number } | null> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const dataView = new DataView(arrayBuffer)

    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    // Check if it's a PNG file
    if (dataView.getUint32(0) !== 0x89504e47 || dataView.getUint32(4) !== 0x0d0a1a0a) {
      console.warn('File is not a PNG')
      return null
    }

    let offset = 8 // Skip PNG signature

    // Parse PNG chunks
    while (offset < arrayBuffer.byteLength) {
      // Read chunk length (4 bytes, big-endian)
      const chunkLength = dataView.getUint32(offset)
      offset += 4

      // Read chunk type (4 bytes)
      const chunkType = String.fromCharCode(
        dataView.getUint8(offset),
        dataView.getUint8(offset + 1),
        dataView.getUint8(offset + 2),
        dataView.getUint8(offset + 3),
      )
      offset += 4

      // If this is the pHYs chunk, read the DPI
      if (chunkType === 'pHYs') {
        // pHYs chunk contains:
        // - Pixels per unit, X axis (4 bytes, big-endian)
        // - Pixels per unit, Y axis (4 bytes, big-endian)
        // - Unit specifier (1 byte): 0 = unit is unknown, 1 = unit is the meter
        const pixelsPerUnitX = dataView.getUint32(offset)
        const pixelsPerUnitY = dataView.getUint32(offset + 4)
        const unitSpecifier = dataView.getUint8(offset + 8)

        if (unitSpecifier === 1) {
          // Unit is meter, convert to DPI
          // 1 meter = 39.3701 inches
          // DPI = pixels per meter / 39.3701
          const xDpi = pixelsPerUnitX / 39.3701
          const yDpi = pixelsPerUnitY / 39.3701
          return { xDpi, yDpi }
        } else if (unitSpecifier === 0) {
          // Unit is unknown, but we can still use the value as pixels per unit
          // Assume it's pixels per meter (common convention)
          const xDpi = pixelsPerUnitX / 39.3701
          const yDpi = pixelsPerUnitY / 39.3701
          return { xDpi, yDpi }
        }
      }

      // Skip chunk data and CRC (4 bytes)
      offset += chunkLength + 4
    }

    // pHYs chunk not found
    return null
  } catch (error) {
    console.error('Error reading PNG DPI:', error)
    return null
  }
}

/**
 * Normalize DPI to a standard value if it's close (within tolerance)
 * This helps correct scanner DPI metadata that's slightly off
 *
 * @param dpi - DPI value to normalize
 * @param standardDpi - Standard DPI value to normalize to (default: 300)
 * @param tolerancePercent - Tolerance percentage (default: 5%)
 * @returns Normalized DPI or original DPI if not close enough
 */
export function normalizeDpi(
  dpi: number,
  standardDpi: number = 300,
  tolerancePercent: number = 5,
): number {
  const tolerance = (standardDpi * tolerancePercent) / 100
  const diff = Math.abs(dpi - standardDpi)

  if (diff <= tolerance) {
    console.log(
      `Normalizing DPI from ${dpi.toFixed(2)} to ${standardDpi} (within ${tolerancePercent}% tolerance)`,
    )
    return standardDpi
  }

  return dpi
}

/**
 * Calculate physical dimensions (in inches) from image dimensions and DPI
 *
 * @param widthPixels - Image width in pixels
 * @param heightPixels - Image height in pixels
 * @param dpi - Dots per inch (defaults to 96 if not provided)
 * @param normalizeToStandard - If true, normalize DPI to 300 if close (default: true)
 * @returns Object with widthInches and heightInches
 */
export function calculatePhysicalDimensions(
  widthPixels: number,
  heightPixels: number,
  dpi?: number | null,
  normalizeToStandard: boolean = true,
): { widthInches: number; heightInches: number } {
  // Default to 96 DPI (common screen resolution) if DPI not provided
  let effectiveDpi = dpi || 96

  // Normalize DPI to 300 if it's close (helps correct scanner metadata errors)
  if (normalizeToStandard && dpi) {
    effectiveDpi = normalizeDpi(dpi, 300, 5)
  }

  return {
    widthInches: widthPixels / effectiveDpi,
    heightInches: heightPixels / effectiveDpi,
  }
}
