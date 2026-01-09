import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Login.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const performLogin = async () => {
    // Validação básica
    if (!email || !senha) {
      setError('Por favor, preencha email e senha')
      return
    }

    setError('')
    setLoading(true)

    try {
      await login(email, senha)
      navigate('/leads')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await performLogin()
  }

  const handleButtonClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Para mobile: garantir que o submit funcione mesmo se o evento submit não for disparado
    e.preventDefault()
    await performLogin()
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>CRM - Gestão de Leads</h1>
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  performLogin()
                }
              }}
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
          <button 
            type="button" 
            disabled={loading} 
            className="btn-primary"
            onClick={handleButtonClick}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}












