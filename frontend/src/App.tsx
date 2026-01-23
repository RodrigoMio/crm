import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import LeadsList from './pages/LeadsList'
import LeadForm from './pages/LeadForm'
import UsersList from './pages/UsersList'
import ColaboradoresList from './pages/ColaboradoresList'
import KanbanModelosList from './pages/KanbanModelosList'
import KanbanAdmin from './pages/KanbanAdmin'
import KanbanAgente from './pages/KanbanAgente'
import KanbanColaborador from './pages/KanbanColaborador'
import Agenda from './pages/Agenda'
import Layout from './components/Layout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Carregando...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  if (user?.perfil !== 'ADMIN') {
    return <Navigate to="/leads" replace />
  }

  return <>{children}</>
}

function AdminOrAgenteRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  if (user?.perfil !== 'ADMIN' && user?.perfil !== 'AGENTE') {
    return <Navigate to="/leads" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/leads" replace />} />
        <Route path="leads" element={<LeadsList />} />
        <Route path="leads/novo" element={<LeadForm />} />
        <Route path="leads/:id" element={<LeadForm />} />
        <Route
          path="users"
          element={
            <AdminRoute>
              <UsersList />
            </AdminRoute>
          }
        />
        <Route
          path="kanban-modelos"
          element={
            <AdminRoute>
              <KanbanModelosList />
            </AdminRoute>
          }
        />
        <Route
          path="kanban-admin"
          element={
            <AdminRoute>
              <KanbanAdmin />
            </AdminRoute>
          }
        />
        <Route
          path="kanban-agente"
          element={
            <AdminOrAgenteRoute>
              <KanbanAgente />
            </AdminOrAgenteRoute>
          }
        />
        <Route
          path="kanban-colaborador"
          element={<KanbanColaborador />}
        />
        <Route
          path="colaboradores"
          element={<ColaboradoresList />}
        />
        <Route
          path="agenda"
          element={<Agenda />}
        />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App







