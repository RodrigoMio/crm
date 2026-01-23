import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import BestPracticesModal from './BestPracticesModal'
import './Layout.css'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [bestPracticesModalOpen, setBestPracticesModalOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="mobile-menu-toggle" 
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            <h1>CRM - Gestão de Leads</h1>
          </div>
          <div className="header-actions">
            <button 
              onClick={() => setBestPracticesModalOpen(true)} 
              className="btn-best-practices"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                <path d="M8 7h8"></path>
                <path d="M8 11h8"></path>
              </svg>
              <span>Manual de boas práticas</span>
            </button>
            <span className="user-info">
              {user?.nome} ({user?.perfil})
            </span>
            <button onClick={handleLogout} className="btn-logout">
              Sair
            </button>
          </div>
        </div>
      </header>

      <nav className={`navbar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <Link to="/leads" className="nav-link" onClick={closeMobileMenu}>
          Leads
        </Link>
        {user?.perfil === 'ADMIN' && (
          <>
            <Link to="/users" className="nav-link" onClick={closeMobileMenu}>
              Usuários
            </Link>
            <Link to="/kanban-admin" className="nav-link" onClick={closeMobileMenu}>
              Kanban (Admin)
            </Link>
          </>
        )}
        {(user?.perfil === 'ADMIN' || user?.perfil === 'AGENTE') && (
          <>
            {user?.perfil === 'AGENTE' && (
              <Link to="/colaboradores" className="nav-link" onClick={closeMobileMenu}>
                Colaboradores
              </Link>
            )}
            <Link to="/kanban-agente" className="nav-link" onClick={closeMobileMenu}>
              Kanban (A)
            </Link>
          </>
        )}
        {(user?.perfil === 'ADMIN' || user?.perfil === 'AGENTE' || user?.perfil === 'COLABORADOR') && (
          <Link to="/kanban-colaborador" className="nav-link" onClick={closeMobileMenu}>
            Funil
          </Link>
        )}
        <Link to="/kanban-modelos" className="nav-link" onClick={closeMobileMenu}>
          Modelos de Kanban
        </Link>
        <Link to="/agenda" className="nav-link" onClick={closeMobileMenu}>
          Agenda
        </Link>
      </nav>

      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={closeMobileMenu}></div>
      )}

      <main className="main-content">
        <Outlet />
      </main>

      {bestPracticesModalOpen && (
        <BestPracticesModal onClose={() => setBestPracticesModalOpen(false)} />
      )}
    </div>
  )
}







