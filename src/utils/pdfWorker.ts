import * as pdfjs from 'pdfjs-dist'

// Initialize PDF.js without worker
const setupPdfWorker = () => {
  // Disable worker to avoid CORS issues
  pdfjs.disableWorker = true
}

export default setupPdfWorker