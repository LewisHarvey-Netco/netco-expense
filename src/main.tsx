import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { RepositoryProvider } from './context/RepositoryContext'

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
