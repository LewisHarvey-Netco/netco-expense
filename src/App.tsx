import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { roleHome } from '@/types'
import ProtectedRoute from '@/components/ProtectedRoute'
import LoginPage from '@/pages/LoginPage'
import ExpensesPage from '@/pages/ExpensesPage'
import ReviewPage from '@/pages/ReviewPage'
import ExpenseDetailPage from '@/pages/ExpenseDetailPage'
import NotFoundPage from '@/pages/NotFoundPage'

function RootRedirect() {
  const { user } = useAuth()
  if (user) {
    return <Navigate to={roleHome(user.role)} replace />
  }
  return <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/expenses"
        element={
          <ProtectedRoute allowedRoles={['consultant']}>
            <ExpensesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/review"
        element={
          <ProtectedRoute allowedRoles={['finance']}>
            <ReviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/review/:id"
        element={
          <ProtectedRoute allowedRoles={['finance']}>
            <ExpenseDetailPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
