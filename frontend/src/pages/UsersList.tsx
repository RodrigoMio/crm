import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { User, UserProfile } from '../types/user'
import { useAuth } from '../contexts/AuthContext'
import './UsersList.css'

export default function UsersList() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    perfil: UserProfile.AGENTE,
    usuario_id_pai: undefined as number | undefined,
    ativo: true,
  })

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users')
      return response.data
    },
  })

  // Busca lista de agentes para seleção de usuario_id_pai
  const { data: agentes = [] } = useQuery({
    queryKey: ['agentes'],
    queryFn: async () => {
      const response = await api.get('/users/agentes')
      return response.data
    },
    enabled: formData.perfil === UserProfile.COLABORADOR,
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowForm(false)
      resetForm()
      toast.success('Usuário criado com sucesso!')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      api.patch(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditingUser(null)
      resetForm()
      toast.success('Usuário atualizado com sucesso!')
    },
    onError: (error: any) => {
      // Erro já é tratado pelo interceptor do axios
      console.error('Erro ao atualizar usuário:', error)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuário excluído com sucesso!')
    },
  })

  const resetForm = () => {
    const defaultPerfil = currentUser?.perfil === 'AGENTE' ? UserProfile.COLABORADOR : UserProfile.AGENTE
    setFormData({
      nome: '',
      email: '',
      senha: '',
      perfil: defaultPerfil,
      usuario_id_pai: currentUser?.perfil === 'AGENTE' ? Number(currentUser.id) : undefined,
      ativo: true,
    })
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      nome: user.nome,
      email: user.email,
      senha: '',
      perfil: user.perfil,
      usuario_id_pai: user.usuario_id_pai,
      ativo: user.ativo,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingUser) {
      // Remove senha se estiver vazia na edição
      const updateData: any = { ...formData }
      if (!updateData.senha || updateData.senha.trim() === '') {
        delete updateData.senha
      }
      // Garante que ativo é boolean
      if (updateData.ativo !== undefined) {
        updateData.ativo = Boolean(updateData.ativo)
      }
      updateMutation.mutate({ id: editingUser.id, data: updateData })
    } else {
      // Garante que todos os campos obrigatórios estão presentes
      const createData: any = {
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        senha: formData.senha,
        perfil: formData.perfil,
        ativo: Boolean(formData.ativo !== undefined ? formData.ativo : true),
      }
      
      // Se for COLABORADOR, inclui usuario_id_pai
      if (formData.perfil === UserProfile.COLABORADOR && formData.usuario_id_pai) {
        createData.usuario_id_pai = formData.usuario_id_pai
      }
      
      createMutation.mutate(createData)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja desativar este usuário?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="users-list">
      <div className="page-header">
        <h1>Usuários</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          Novo Usuário
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => {
          setShowForm(false)
          setEditingUser(null)
          resetForm()
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Senha {!editingUser && '*'}</label>
                <input
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  required={!editingUser}
                  placeholder={editingUser ? 'Deixe em branco para não alterar' : ''}
                />
              </div>
              <div className="form-group">
                <label>Perfil *</label>
                <select
                  value={formData.perfil}
                  onChange={(e) => {
                    const newPerfil = e.target.value as UserProfile
                    setFormData({ 
                      ...formData, 
                      perfil: newPerfil,
                      // Se mudar para COLABORADOR e for Agente, preenche automaticamente
                      usuario_id_pai: newPerfil === UserProfile.COLABORADOR && currentUser?.perfil === 'AGENTE' 
                        ? Number(currentUser.id) 
                        : newPerfil === UserProfile.COLABORADOR 
                        ? formData.usuario_id_pai 
                        : undefined
                    })
                  }}
                  disabled={currentUser?.perfil === 'AGENTE' && !editingUser}
                >
                  {currentUser?.perfil === 'ADMIN' && <option value={UserProfile.ADMIN}>Admin</option>}
                  {currentUser?.perfil === 'ADMIN' && <option value={UserProfile.AGENTE}>Agente</option>}
                  <option value={UserProfile.COLABORADOR}>Colaborador</option>
                </select>
              </div>
              
              {formData.perfil === UserProfile.COLABORADOR && (
                <div className="form-group">
                  <label>Agente Pai *</label>
                  <select
                    value={formData.usuario_id_pai || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, usuario_id_pai: Number(e.target.value) })
                    }
                    required
                    disabled={currentUser?.perfil === 'AGENTE' && !editingUser}
                  >
                    <option value="">Selecione um Agente</option>
                    {agentes.map((agente: User) => (
                      <option key={agente.id} value={agente.id}>
                        {agente.nome}
                      </option>
                    ))}
                  </select>
                  {currentUser?.perfil === 'AGENTE' && !editingUser && (
                    <small style={{ color: '#666', fontSize: '0.9em' }}>
                      O colaborador será vinculado a você automaticamente
                    </small>
                  )}
                </div>
              )}
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  />
                  Ativo
                </label>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingUser(null)
                    resetForm()
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div>Carregando...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.nome}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.perfil}
                    {user.perfil === UserProfile.COLABORADOR && user.usuario_pai && (
                      <small style={{ display: 'block', color: '#666', fontSize: '0.85em' }}>
                        (Pai: {user.usuario_pai.nome})
                      </small>
                    )}
                  </td>
                  <td>{user.ativo ? 'Ativo' : 'Inativo'}</td>
                  <td>
                    <button onClick={() => handleEdit(user)} className="btn-edit">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="btn-delete">
                      Desativar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}




