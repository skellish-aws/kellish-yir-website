// src/utils/imageDpiReader.ts
// Read DPI/resolution metadata from PNG and JPEG files
import ExifReader from 'exifreader'

/**
 * Read DPI (dots per inch) from a PNG file
 * PNG files store resolution in the pHYs chunk
 */
async function readPngDpi(
  arrayBuffer: ArrayBuffer,
): Promise<{ xDpi: number; yDpi: number } | null> {
  try {
    const dataView = new DataView(arrayBuffer)

    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (dataView.getUint32(0) !== 0x89504e47 || dataView.getUint32(4) !== 0x0d0a1a0a) {
      return null
    }

    let offset = 8 // Skip PNG signature

    // Parse PNG chunks
    while (offset < arrayBuffer.byteLength) {
      const chunkLength = dataView.getUint32(offset)
      offset += 4

      const chunkType = String.fromCharCode(
        dataView.getUint8(offset),
        dataView.getUint8(offset + 1),
        dataView.getUint8(offset + 2),
        dataView.getUint8(offset + 3),
      )
      offset += 4

      if (chunkType === 'pHYs') {
        const pixelsPerUnitX = dataView.getUint32(offset)
        const pixelsPerUnitY = dataView.getUint32(offset + 4)
        const unitSpecifier = dataView.getUint8(offset + 8)

        if (unitSpecifier === 1 || unitSpecifier === 0) {
          // Unit is meter or unknown (assume meter)
          const xDpi = pixelsPerUnitX / 39.3701
          const yDpi = pixelsPerUnitY / 39.3701
          return { xDpi, yDpi }
        }
      }

      offset += chunkLength + 4 // Skip chunk data and CRC
    }

    return null
  } catch (error) {
    console.error('Error reading PNG DPI:', error)
    return null
  }
}

/**
 * Read DPI (dots per inch) from a JPEG file
 * JPEG files store resolution in EXIF or JFIF segments
 */
async function readJpegDpi(
  arrayBuffer: ArrayBuffer,
): Promise<{ xDpi: number; yDpi: number } | null> {
  try {
    const dataView = new DataView(arrayBuffer)

    // JPEG signature: FF D8 FF
    if (dataView.getUint8(0) !== 0xff || dataView.getUint8(1) !== 0xd8) {
      return null
    }

    let offset = 2
    let jfifDpi: { xDpi: number; yDpi: number } | null = null

    // Parse JPEG segments - check JFIF first
    while (offset < arrayBuffer.byteLength - 1) {
      // Find segment marker (FF XX)
      if (dataView.getUint8(offset) !== 0xff) {
        offset++
        continue
      }

      const marker = dataView.getUint8(offset + 1)

      // Skip padding bytes (FF 00)
      if (marker === 0x00) {
        offset += 2
        continue
      }

      // End of image
      if (marker === 0xd9) {
        break
      }

      // Read segment length (2 bytes, big-endian)
      const segmentLength = dataView.getUint16(offset + 2)
      offset += 4

      // JFIF segment (APP0)
      if (marker === 0xe0) {
        // Check for JFIF identifier (4A 46 49 46 00)
        if (
          offset + 5 <= arrayBuffer.byteLength &&
          dataView.getUint8(offset) === 0x4a &&
          dataView.getUint8(offset + 1) === 0x46 &&
          dataView.getUint8(offset + 2) === 0x49 &&
          dataView.getUint8(offset + 3) === 0x46 &&
          dataView.getUint8(offset + 4) === 0x00
        ) {
          // JFIF density unit (offset + 11)
          const densityUnit = dataView.getUint8(offset + 11)
          // X density (offset + 12-13)
          const xDensity = dataView.getUint16(offset + 12)
          // Y density (offset + 14-15)
          const yDensity = dataView.getUint16(offset + 14)

          if (densityUnit === 1) {
            // Dots per inch
            jfifDpi = { xDpi: xDensity, yDpi: yDensity }
          } else if (densityUnit === 2) {
            // Dots per centimeter, convert to DPI
            jfifDpi = { xDpi: xDensity * 2.54, yDpi: yDensity * 2.54 }
          }
        }
      }

      // EXIF segment (APP1) - will be handled separately using ExifReader
      // Skip for now, we'll parse EXIF after checking JFIF

      offset += segmentLength - 2 // Move to next segment
    }

    // If JFIF had valid DPI, return it
    if (jfifDpi) {
      return jfifDpi
    }

    // If JFIF didn't have DPI, try EXIF using ExifReader library
    try {
      const tags = ExifReader.load(arrayBuffer)

      // Check for XResolution and YResolution in EXIF
      if (tags['XResolution'] && tags['YResolution']) {
        const xRes = tags['XResolution']
        const yRes = tags['YResolution']

        // EXIF resolution is typically stored as a rational number (numerator/denominator)
        let xDpi: number
        let yDpi: number

        if (xRes.value && Array.isArray(xRes.value) && xRes.value.length >= 2) {
          const num = Number(xRes.value[0])
          const den = Number(xRes.value[1])
          if (isNaN(num) || isNaN(den) || den === 0) {
            return null
          }
          xDpi = num / den
        } else if (typeof xRes.value === 'number') {
          xDpi = xRes.value
        } else {
          return null
        }

        if (yRes.value && Array.isArray(yRes.value) && yRes.value.length >= 2) {
          const num = Number(yRes.value[0])
          const den = Number(yRes.value[1])
          if (isNaN(num) || isNaN(den) || den === 0) {
            return null
          }
          yDpi = num / den
        } else if (typeof yRes.value === 'number') {
          yDpi = yRes.value
        } else {
          return null
        }

        // Check resolution unit (2 = inches, 3 = centimeters)
        const resolutionUnit = tags['ResolutionUnit']?.value
        if (resolutionUnit === 3) {
          // Centimeters, convert to DPI
          xDpi = xDpi * 2.54
          yDpi = yDpi * 2.54
        } else if (resolutionUnit !== 2) {
          // If not inches or centimeters, assume inches (common default)
        }

        return { xDpi, yDpi }
      }
    } catch (exifError) {
      // EXIF parsing failed, that's okay - we tried
      console.debug('EXIF parsing failed:', exifError)
    }

    return null
  } catch (error) {
    console.error('Error reading JPEG DPI:', error)
    return null
  }
}

/**
 * Read DPI from an image file (PNG or JPEG)
 *
 * @param file - Image file to read
 * @returns Object with xDpi and yDpi, or null if not found/error
 */
export async function readImageDpi(file: File): Promise<{ xDpi: number; yDpi: number } | null> {
  try {
    const arrayBuffer = await file.arrayBuffer()

    if (file.type === 'image/png') {
      return await readPngDpi(arrayBuffer)
    } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      return await readJpegDpi(arrayBuffer)
    }

    return null
  } catch (error) {
    console.error('Error reading image DPI:', error)
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
