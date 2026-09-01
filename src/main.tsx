import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.tsx'
import { SupabaseProvider } from './providers/supabase-provider'
import { QueryProvider } from './providers/query-provider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SupabaseProvider>
        <QueryProvider>
          <App />
          <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        </QueryProvider>
      </SupabaseProvider>
    </BrowserRouter>
  </StrictMode>
)
