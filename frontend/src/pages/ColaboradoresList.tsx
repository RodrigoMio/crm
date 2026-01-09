import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { api } from '../services/api'
import { User, UserProfile } from '../types/user'
import { useAuth } from '../contexts/AuthContext'
import './ColaboradoresList.css'

export default function ColaboradoresList() {
  const queryClient = useQueryClient()
  const { user: currentUser } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [editingColaborador, setEditingColaborador] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    perfil: UserProfile.COLABORADOR,
    usuario_id_pai: currentUser?.id ? Number(currentUser.id) : undefined,
    ativo: true,
  })

  // Busca colaboradores do agente logado
  const { data: colaboradores = [], isLoading } = useQuery<User[]>({
    queryKey: ['colaboradores'],
    queryFn: async () => {
      const response = await api.get('/users/colaboradores')
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] })
      setShowForm(false)
      resetForm()
      toast.success('Colaborador criado com sucesso!')
    },
    onError: (error: any) => {
      // Erro já é tratado pelo interceptor do axios
      console.error('Erro ao criar colaborador:', error)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      api.patch(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] })
      setEditingColaborador(null)
      resetForm()
      toast.success('Colaborador atualizado com sucesso!')
    },
    onError: (error: any) => {
      // Erro já é tratado pelo interceptor do axios
      console.error('Erro ao atualizar colaborador:', error)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['colaboradores'] })
      toast.success('Colaborador desativado com sucesso!')
    },
    onError: (error: any) => {
      // Erro já é tratado pelo interceptor do axios
      console.error('Erro ao desativar colaborador:', error)
    },
  })

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      senha: '',
      perfil: UserProfile.COLABORADOR,
      usuario_id_pai: currentUser?.id ? Number(currentUser.id) : undefined,
      ativo: true,
    })
    setEditingColaborador(null)
  }

  const handleEdit = (colaborador: User) => {
    setEditingColaborador(colaborador)
    setFormData({
      nome: colaborador.nome,
      email: colaborador.email,
      senha: '',
      perfil: colaborador.perfil,
      usuario_id_pai: colaborador.usuario_id_pai,
      ativo: colaborador.ativo,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingColaborador) {
      // Remove senha se estiver vazia na edição
      const updateData: any = { ...formData }
      if (!updateData.senha || updateData.senha.trim() === '') {
        delete updateData.senha
      }
      updateData.ativo = Boolean(updateData.ativo)
      updateMutation.mutate({ id: editingColaborador.id, data: updateData })
    } else {
      // Garante que todos os campos obrigatórios estão presentes
      const createData = {
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        senha: formData.senha,
        perfil: UserProfile.COLABORADOR,
        usuario_id_pai: currentUser?.id ? Number(currentUser.id) : undefined,
        ativo: Boolean(formData.ativo !== undefined ? formData.ativo : true),
      }
      createMutation.mutate(createData)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja desativar este colaborador?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="colaboradores-list">
      <div className="page-header">
        <h1>Colaboradores</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          Novo Colaborador
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => {
          setShowForm(false)
          setEditingColaborador(null)
          resetForm()
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingColaborador ? 'Editar Colaborador' : 'Novo Colaborador'}</h2>
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
                <label>Senha {!editingColaborador && '*'}</label>
                <input
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  required={!editingColaborador}
                  placeholder={editingColaborador ? 'Deixe em branco para não alterar' : ''}
                />
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
                    setEditingColaborador(null)
                    resetForm()
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending 
                    ? 'Salvando...' 
                    : editingColaborador 
                    ? 'Atualizar' 
                    : 'Criar'}
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
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {colaboradores.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                    Nenhum colaborador cadastrado. Clique em "Novo Colaborador" para adicionar.
                  </td>
                </tr>
              ) : (
                colaboradores.map((colaborador) => (
                  <tr key={colaborador.id}>
                    <td>{colaborador.nome}</td>
                    <td>{colaborador.email}</td>
                    <td>{colaborador.ativo ? 'Ativo' : 'Inativo'}</td>
                    <td>
                      <button onClick={() => handleEdit(colaborador)} className="btn-edit">
                        Editar
                      </button>
                      <button onClick={() => handleDelete(colaborador.id)} className="btn-delete">
                        Desativar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}



