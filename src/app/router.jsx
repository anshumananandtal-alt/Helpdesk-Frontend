import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../auth/ProtectedRoute'
import PublicRoute from '../auth/PublicRoute'
import DashboardShell from '../features/admin/DashboardShell'
import DashboardPage from '../features/admin/DashboardPage'
import UsersPage from '../features/admin/UsersPage'
import LoginPage from '../features/auth/LoginPage'
import RegisterPage from '../features/auth/RegisterPage'
import TicketDetailPage from '../features/tickets/TicketDetailPage'
import TicketListPage from '../features/tickets/TicketListPage'
import CreateTicketPage from '../features/tickets/CreateTicketPage'
import { ErrorState } from '../components/common/DataState'

function ForbiddenPage() {
  return <ErrorState error={{ message: 'You do not have permission to view this page.' }} />
}

export default function AppRouter() {
  return <Routes>
    <Route element={<PublicRoute />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Route>
    <Route path="/403" element={<ForbiddenPage />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<DashboardShell />}>
        <Route index element={<Navigate to="/tickets" replace />} />
        <Route path="/tickets" element={<TicketListPage />} />
        <Route path="/tickets/new" element={<CreateTicketPage />} />
        <Route path="/tickets/:id" element={<TicketDetailPage />} />
      </Route>
    </Route>
    <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
      <Route element={<DashboardShell />}>
        <Route path="/admin/dashboard" element={<DashboardPage />} />
        <Route path="/admin/users" element={<UsersPage />} />
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/tickets" replace />} />
  </Routes>
}
