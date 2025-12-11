import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Layout.css'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <h1>CRM - Gestão de Leads</h1>
          <div className="header-actions">
            <span className="user-info">
              {user?.nome} ({user?.perfil})
            </span>
            <button onClick={handleLogout} className="btn-logout">
              Sair
            </button>
          </div>
        </div>
      </header>

      <nav className="navbar">
        <Link to="/leads" className="nav-link">
          Leads
        </Link>
        {user?.perfil === 'ADMIN' && (
          <Link to="/users" className="nav-link">
            Usuários
          </Link>
        )}
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}




