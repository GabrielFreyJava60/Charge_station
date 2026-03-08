import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/auth/ProtectedRoute'
import Login from '@/auth/Login'
import Register from '@/auth/Register'

import NotFound from '@/pages/error/NotFound'
import ErrorForbidden from '@/pages/error/ErrorForbidden'
import ErrorSystem from '@/pages/error/ErrorSystem'

import Dashboard from '@/pages/Dashboard'
import GuestPage from '@/pages/GuestPage'
import StationList from '@/pages/user/StationList'
import StationDetail from '@/pages/user/StationDetail'
import ChargingSession from '@/pages/user/ChargingSession'
import SessionHistory from '@/pages/user/SessionHistory'

import Profile from '@/pages/account/Profile'
import Settings from '@/pages/account/Settings'

import SupportDashboard from '@/pages/support/SupportDashboard'
import SupportSessions from '@/pages/support/SupportSessions'
import ErrorLog from '@/pages/techSupport/ErrorLog'
import StationManagement from '@/pages/techSupport/StationManagement'

import AdminDashboard from '@/pages/admin/AdminDashboard'
import UserManagement from '@/pages/admin/UserManagement'
import StationAdmin from '@/pages/admin/StationAdmin'
import TariffManagement from '@/pages/admin/TariffManagement'

const SUPPORT = ['TECH_SUPPORT', 'ADMIN']
const ADMIN = ['ADMIN']

function Wrap({ children }: { children: React.ReactNode }) {
  return <Layout>{children}</Layout>
}

export default function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Wrap><Login /></Wrap>} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Wrap><Register /></Wrap>} />
      <Route path="/error/forbidden" element={<ErrorForbidden />} />
      <Route path="/error/system" element={<ErrorSystem />} />

      <Route path="/" element={isAuthenticated ? <Wrap><Dashboard /></Wrap> : <Wrap><GuestPage /></Wrap>} />

      <Route path="/stations" element={<Wrap><StationList /></Wrap>} />
      <Route path="/stations/:id" element={<Wrap><StationDetail /></Wrap>} />

      <Route path="/sessions/current" element={<ProtectedRoute><Wrap><ChargingSession /></Wrap></ProtectedRoute>} />
      <Route path="/sessions/history" element={<ProtectedRoute><Wrap><SessionHistory /></Wrap></ProtectedRoute>} />

      <Route path="/account/profile" element={<ProtectedRoute><Wrap><Profile /></Wrap></ProtectedRoute>} />
      <Route path="/account/settings" element={<ProtectedRoute><Wrap><Settings /></Wrap></ProtectedRoute>} />

      <Route path="/support/dashboard" element={<ProtectedRoute roles={SUPPORT}><Wrap><SupportDashboard /></Wrap></ProtectedRoute>} />
      <Route path="/support/logs" element={<ProtectedRoute roles={SUPPORT}><Wrap><ErrorLog /></Wrap></ProtectedRoute>} />
      <Route path="/support/stations" element={<ProtectedRoute roles={SUPPORT}><Wrap><StationManagement /></Wrap></ProtectedRoute>} />
      <Route path="/support/sessions" element={<ProtectedRoute roles={SUPPORT}><Wrap><SupportSessions /></Wrap></ProtectedRoute>} />

      <Route path="/admin/dashboard" element={<ProtectedRoute roles={ADMIN}><Wrap><AdminDashboard /></Wrap></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={ADMIN}><Wrap><UserManagement /></Wrap></ProtectedRoute>} />
      <Route path="/admin/stations" element={<ProtectedRoute roles={ADMIN}><Wrap><StationAdmin /></Wrap></ProtectedRoute>} />
      <Route path="/admin/tariffs" element={<ProtectedRoute roles={ADMIN}><Wrap><TariffManagement /></Wrap></ProtectedRoute>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
