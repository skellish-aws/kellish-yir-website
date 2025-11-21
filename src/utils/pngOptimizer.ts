// src/utils/pngOptimizer.ts
// Optimize PNG files to reduce file size while maintaining quality
import imageCompression from 'browser-image-compression'

/**
 * Optimize PNG file to reduce size for web viewing
 * Optimized for viewing (not printing), so allows more compression
 *
 * @param file - Original PNG file
 * @param targetSizeMB - Target file size in MB (default: 1MB for web viewing)
 * @returns Optimized PNG file
 */
export async function optimizePng(file: File, targetSizeMB: number = 1.0): Promise<File> {
  // Only optimize PNG files
  if (file.type !== 'image/png') {
    return file
  }

  // Only optimize if file is larger than 2MB
  const fileSizeMB = file.size / (1024 * 1024)
  if (fileSizeMB <= 2) {
    console.log(`PNG file is already small (${fileSizeMB.toFixed(2)}MB), skipping optimization`)
    return file
  }

  try {
    console.log(`Optimizing PNG: ${fileSizeMB.toFixed(2)}MB -> target: ${targetSizeMB}MB`)

    const options = {
      maxSizeMB: targetSizeMB,
      maxWidthOrHeight: undefined, // Don't resize, just compress
      useWebWorker: true, // Use web worker for better performance
      fileType: 'image/png', // Keep as PNG
      initialQuality: 0.85, // Lower quality for smaller file size (still good for web viewing)
      alwaysKeepResolution: true, // Don't reduce resolution
      // Performance optimizations
      maxIteration: 15, // More iterations to achieve smaller size
    }

    const compressedFile = await imageCompression(file, options)

    const compressedSizeMB = compressedFile.size / (1024 * 1024)
    const reductionPercent = ((file.size - compressedFile.size) / file.size) * 100

    console.log(
      `PNG optimized: ${fileSizeMB.toFixed(2)}MB -> ${compressedSizeMB.toFixed(2)}MB (${reductionPercent.toFixed(1)}% reduction)`,
    )

    return compressedFile
  } catch (error) {
    console.error('Error optimizing PNG:', error)
    // If optimization fails, return original file
    console.warn('Returning original file due to optimization error')
    return file
  }
}
