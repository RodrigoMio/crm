import axios from 'axios'
import { toast } from 'react-toastify'

// Configuração da URL base da API
// Em desenvolvimento: usa proxy do Vite (/api)
// Em produção: usa variável de ambiente ou URL completa
const getApiBaseURL = () => {
  // Se estiver em desenvolvimento, usa o proxy do Vite
  if (import.meta.env.DEV) {
    return '/api'
  }
  
  // PRIORIDADE 1: Variável de ambiente VITE_API_URL (permite configurar URL completa com porta)
  const apiUrl = import.meta.env.VITE_API_URL
  
  if (apiUrl) {
    // Remove barras finais e verifica se já tem /api
    const cleanUrl = apiUrl.replace(/\/+$/, '')
    
    // Se a URL já termina com /api, não adiciona novamente
    if (cleanUrl.endsWith('/api')) {
      return cleanUrl
    }
    
    // Se não tem /api, adiciona
    return `${cleanUrl}/api`
  }
  
  // PRIORIDADE 2: Usar proxy reverso (assumindo que está configurado)
  // Na KingHost, a porta 21008 não é acessível externamente
  // É necessário configurar proxy reverso no Apache ou usar VITE_API_URL
  const protocol = window.location.protocol
  const hostname = window.location.hostname
  
  // Se for localhost, mantém o comportamento de desenvolvimento
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return '/api'
  }
  
  // Em produção, tenta usar proxy reverso (mesma origem)
  // Se não houver proxy reverso configurado, isso falhará
  // Nesse caso, o usuário DEVE configurar VITE_API_URL no .env do frontend
  // ou contatar suporte da KingHost para configurar proxy reverso
  return `${protocol}//${hostname}/api`
}

export const api = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para tratar erros de autenticação e exibir mensagens amigáveis
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // Exibe mensagem de erro amigável
    let errorMessage = 'Ocorreu um erro inesperado. Por favor, tente novamente.'
    
    if (error.response?.data?.message) {
      // Se a mensagem é um array, junta todas as mensagens
      if (Array.isArray(error.response.data.message)) {
        errorMessage = error.response.data.message.join(', ')
      } else {
        errorMessage = error.response.data.message
      }
    } else if (error.message) {
      errorMessage = error.message
    }
    
    // Não exibe toast para erros 401 (já redireciona para login)
    if (error.response?.status !== 401) {
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      })
    }

    return Promise.reject(error)
  }
)






