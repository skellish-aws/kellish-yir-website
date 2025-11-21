// src/utils/imageOptimizer.ts
// Optimize PNG and JPEG files to reduce file size for web viewing
import imageCompression from 'browser-image-compression'

/**
 * Optimize image file (PNG or JPEG) to reduce size for web viewing
 * Optimized for viewing (not printing), so allows more compression
 *
 * @param file - Original image file (PNG or JPEG)
 * @param targetSizeMB - Target file size in MB (default: 1MB for web viewing)
 * @returns Optimized image file
 */
export async function optimizeImage(file: File, targetSizeMB: number = 1.0): Promise<File> {
  // Only optimize PNG and JPEG files
  if (file.type !== 'image/png' && file.type !== 'image/jpeg' && file.type !== 'image/jpg') {
    return file
  }

  // Only optimize if file is larger than 1MB
  const fileSizeMB = file.size / (1024 * 1024)
  if (fileSizeMB <= 1) {
    console.log(`Image file is already small (${fileSizeMB.toFixed(2)}MB), skipping optimization`)
    return file
  }

  try {
    const isJpeg = file.type === 'image/jpeg' || file.type === 'image/jpg'
    console.log(
      `Optimizing ${isJpeg ? 'JPEG' : 'PNG'}: ${fileSizeMB.toFixed(2)}MB -> target: ${targetSizeMB}MB`,
    )

    const options = {
      maxSizeMB: targetSizeMB,
      maxWidthOrHeight: undefined, // Don't resize, just compress
      useWebWorker: true, // Use web worker for better performance
      fileType: isJpeg ? 'image/jpeg' : 'image/png',
      initialQuality: isJpeg ? 0.85 : 0.85, // Good quality for web viewing
      alwaysKeepResolution: true, // Don't reduce resolution
      // Performance optimizations
      maxIteration: 15, // More iterations to achieve smaller size
    }

    const compressedFile = await imageCompression(file, options)

    const compressedSizeMB = compressedFile.size / (1024 * 1024)
    const reductionPercent = ((file.size - compressedFile.size) / file.size) * 100

    console.log(
      `${isJpeg ? 'JPEG' : 'PNG'} optimized: ${fileSizeMB.toFixed(2)}MB -> ${compressedSizeMB.toFixed(2)}MB (${reductionPercent.toFixed(1)}% reduction)`,
    )

    return compressedFile
  } catch (error) {
    console.error('Error optimizing image:', error)
    // If optimization fails, return original file
    console.warn('Returning original file due to optimization error')
    return file
  }
}
