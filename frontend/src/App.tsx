import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/auth/ProtectedRoute';
import Login from '@/auth/Login';
import Register from '@/auth/Register';
import Dashboard from '@/pages/Dashboard';
import StationList from '@/pages/user/StationList';
import StationDetail from '@/pages/user/StationDetail';
import ChargingSession from '@/pages/user/ChargingSession';
import SessionHistory from '@/pages/user/SessionHistory';
import ErrorLog from '@/pages/techSupport/ErrorLog';
import StationManagement from '@/pages/techSupport/StationManagement';
import SystemStats from '@/pages/techSupport/SystemStats';
import UserManagement from '@/pages/admin/UserManagement';
import StationAdmin from '@/pages/admin/StationAdmin';
import TariffManagement from '@/pages/admin/TariffManagement';

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />

      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />

      <Route path="/stations" element={<ProtectedRoute><Layout><StationList /></Layout></ProtectedRoute>} />
      <Route path="/stations/:id" element={<ProtectedRoute><Layout><StationDetail /></Layout></ProtectedRoute>} />
      <Route path="/charging" element={<ProtectedRoute><Layout><ChargingSession /></Layout></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><Layout><SessionHistory /></Layout></ProtectedRoute>} />

      <Route path="/tech/errors" element={<ProtectedRoute roles={['TECH_SUPPORT', 'ADMIN']}><Layout><ErrorLog /></Layout></ProtectedRoute>} />
      <Route path="/tech/manage" element={<ProtectedRoute roles={['TECH_SUPPORT', 'ADMIN']}><Layout><StationManagement /></Layout></ProtectedRoute>} />
      <Route path="/tech/stats" element={<ProtectedRoute roles={['TECH_SUPPORT', 'ADMIN']}><Layout><SystemStats /></Layout></ProtectedRoute>} />

      <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><Layout><UserManagement /></Layout></ProtectedRoute>} />
      <Route path="/admin/stations" element={<ProtectedRoute roles={['ADMIN']}><Layout><StationAdmin /></Layout></ProtectedRoute>} />
      <Route path="/admin/tariffs" element={<ProtectedRoute roles={['ADMIN']}><Layout><TariffManagement /></Layout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
