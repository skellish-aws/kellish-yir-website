import * as pdfjs from 'pdfjs-dist'
import { GlobalWorkerOptions } from 'pdfjs-dist'

// Set worker source to a local file in the public directory
GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export async function generatePdfThumbnail(file: File): Promise<Blob | null> {
  try {
    // For PDFs, render the first page
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjs.getDocument(arrayBuffer)
    const pdf = await loadingTask.promise
    const page = await pdf.getPage(1)

    const viewport = page.getViewport({ scale: 1.0 })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    if (!context) {
      console.error('Could not get canvas context')
      return null
    }

    // Scale to fit within 200x200 while maintaining aspect ratio
    const scale = Math.min(200 / viewport.width, 200 / viewport.height)
    canvas.width = viewport.width * scale
    canvas.height = viewport.height * scale

    await page.render({
      canvasContext: context,
      viewport: page.getViewport({ scale }),
    }).promise

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85)
    })
  } catch (error) {
    console.error('Error generating PDF thumbnail:', error)
    
    // Fallback to placeholder if rendering fails
    const canvas = document.createElement('canvas')
    canvas.width = 200
    canvas.height = 200
    const context = canvas.getContext('2d')
    
    if (!context) {
      return null
    }
    
    context.fillStyle = '#f5f5f5'
    context.fillRect(0, 0, 200, 200)
    context.fillStyle = '#e53935'
    context.fillRect(50, 40, 100, 120)
    context.fillStyle = 'white'
    context.font = 'bold 30px Arial'
    context.fillText('PDF', 70, 110)
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85)
    })
  }
}