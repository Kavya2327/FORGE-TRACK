import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import DevTokens from './pages/DevTokens'
import Login from './pages/Login'
import Shell from './components/layout/Shell'
import Dashboard from './pages/Dashboard'
import MarkAttendance from './pages/MarkAttendance'
import StudentHistory from './pages/StudentHistory'
import Materials from './pages/Materials'
import MyAttendance from './pages/student/MyAttendance'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/403" replace />
  return children
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
        <Route path="upload" element={<ProtectedRoute allowedRoles={['mentor']}><div>Upload CSV</div></ProtectedRoute>} />

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
  const { loading } = useAuth()
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