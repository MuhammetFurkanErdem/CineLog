import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'

// Lazy load the main App component for better initial load performance
const App = lazy(() => import('./App.jsx'))

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0a0118] via-[#1a0b2e] to-[#2d1b4e]">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
      <p className="text-purple-300 text-lg font-medium">CineLog yükleniyor...</p>
    </div>
  </div>
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={<LoadingSpinner />}>
      <App />
    </Suspense>
  </StrictMode>,
)
