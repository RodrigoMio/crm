import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { User, UserProfile } from '../types/user'
import './UsersList.css'

export default function UsersList() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    perfil: UserProfile.AGENTE,
    ativo: true,
  })

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowForm(false)
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      api.patch(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditingUser(null)
      resetForm()
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar usuário:', error)
      alert(error.response?.data?.message || 'Erro ao atualizar usuário')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      senha: '',
      perfil: UserProfile.AGENTE,
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
      const createData = {
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        senha: formData.senha,
        perfil: formData.perfil,
        ativo: Boolean(formData.ativo !== undefined ? formData.ativo : true),
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
                  onChange={(e) =>
                    setFormData({ ...formData, perfil: e.target.value as UserProfile })
                  }
                >
                  <option value={UserProfile.ADMIN}>Admin</option>
                  <option value={UserProfile.AGENTE}>Agente</option>
                </select>
              </div>
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
                  <td>{user.perfil}</td>
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




