import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import DevTokens from './pages/DevTokens'
import Login from './pages/Login'
import Shell from './components/layout/Shell'
import Dashboard from './pages/Dashboard'
import MarkAttendance from './pages/MarkAttendance'
import StudentHistory from './pages/StudentHistory'
import Materials from './pages/Materials'
import UploadCSV from './pages/UploadCSV'
import BulkAttendance from './pages/BulkAttendance'
import MyAttendance from './pages/student/MyAttendance'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  
  // Dev Override: If we are in dev and have a user but no role yet, allow access to unblock UI
  if (import.meta.env.DEV && !role) {
    console.warn('Dev Mode: Bypassing role check for', window.location.pathname)
    return children
  }

  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/403" replace />
  return children
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return children
}

const RootRedirect = () => {
  const { user, role, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!role) return <Navigate to="/login" replace />
  return <Navigate to={role === 'mentor' ? '/dashboard' : '/me/attendance'} replace />
}


function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/403" element={<div className="flex items-center justify-center min-h-screen">403 | Forbidden</div>} />

      <Route path="/" element={
        <ProtectedRoute allowedRoles={['mentor', 'student']}>
          <Shell />
        </ProtectedRoute>
      }>
        <Route index element={<RootRedirect />} />

        {/* Mentor */}
        <Route path="dashboard" element={<ProtectedRoute allowedRoles={['mentor']}><Dashboard /></ProtectedRoute>} />
        <Route path="attendance" element={<ProtectedRoute allowedRoles={['mentor']}><MarkAttendance /></ProtectedRoute>} />
        <Route path="history" element={<ProtectedRoute allowedRoles={['mentor']}><StudentHistory /></ProtectedRoute>} />
        <Route path="materials" element={<ProtectedRoute allowedRoles={['mentor']}><Materials /></ProtectedRoute>} />
        <Route path="upload" element={<ProtectedRoute allowedRoles={['mentor']}><UploadCSV /></ProtectedRoute>} />
        <Route path="bulk-attendance" element={<ProtectedRoute allowedRoles={['mentor']}><BulkAttendance /></ProtectedRoute>} />

        {/* Student */}
        <Route path="me/attendance" element={<ProtectedRoute allowedRoles={['student']}><MyAttendance /></ProtectedRoute>} />
        <Route path="me/upcoming" element={<ProtectedRoute allowedRoles={['student']}><div>Upcoming</div></ProtectedRoute>} />
        <Route path="me/materials" element={<ProtectedRoute allowedRoles={['student']}><div>My Materials</div></ProtectedRoute>} />
      </Route>

      <Route path="/dev-tokens" element={<DevTokens />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AuthLoadingWrapper({ children }) {
  const { loading, error } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent-glow/20 border-t-accent-glow rounded-full animate-spin" />
          <p className="text-label text-fg-tertiary animate-pulse">Initializing ForgeTrack...</p>
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center p-6">
        <div className="glass-card max-w-md p-8 border-danger-border/30 text-center">
          <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-h3 mb-2 text-fg-primary">Configuration Error</h2>
          <p className="text-body text-fg-secondary mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-surface-raised border border-border-default px-6 py-2 rounded-lg text-sm font-medium hover:bg-surface transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }
  return children
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AuthLoadingWrapper>
          <AppRoutes />
        </AuthLoadingWrapper>
      </Router>
    </AuthProvider>
  )
}

export default App