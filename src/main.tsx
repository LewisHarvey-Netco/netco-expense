import * as Sentry from '@sentry/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { RepositoryProvider } from './context/RepositoryContext'

// Initialize Sentry as early as possible in the app lifecycle
Sentry.init({
  dsn: 'https://f97d41361bf78975fe8d71a41b40eaf2@o4512085232779264.ingest.de.sentry.io/4512085245886544',
  environment: import.meta.env.MODE,
  tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/* Both are top-level app providers; RepositoryProvider is grouped outermost
          as the data-access boundary (ADR-0010). Order between them is not
          functionally significant — neither depends on the other. */}
      <RepositoryProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </RepositoryProvider>
    </BrowserRouter>
  </StrictMode>,
)
