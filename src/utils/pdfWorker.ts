import { GlobalWorkerOptions } from 'pdfjs-dist'

// Initialize PDF.js without worker
// Setting workerSrc to empty string disables the worker
GlobalWorkerOptions.workerSrc = ''

export default function setupPdfWorker() {
  // Worker is disabled via GlobalWorkerOptions.workerSrc = '' above
  // This avoids CORS issues when loading PDF workers
}