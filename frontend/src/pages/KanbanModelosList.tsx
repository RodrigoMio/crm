import { useQuery } from '@tanstack/react-query'
import { api } from '../services/api'
import { KanbanModelo } from '../types/kanban'
import './KanbanModelosList.css'

export default function KanbanModelosList() {
  const { data: modelos = [], isLoading } = useQuery<KanbanModelo[]>({
    queryKey: ['kanban-modelos'],
    queryFn: async () => {
      const response = await api.get('/kanban-modelos')
      return response.data
    },
  })

  if (isLoading) {
    return <div className="kanban-loading">Carregando modelos de kanban...</div>
  }

  return (
    <div className="kanban-modelos-container">
      <div className="kanban-header">
        <h1>Modelos de Kanban</h1>
        <button className="btn-novo-modelo">Novo modelo</button>
      </div>

      <div className="kanban-modelos-list">
        {modelos.map((modelo) => (
          <div key={modelo.kanban_modelo_id} className="kanban-modelo-card">
            <h2 className="kanban-modelo-title">{modelo.descricao}</h2>
            <div className="kanban-status-tags">
              {modelo.statuses.map((status) => (
                <span
                  key={status.kanban_status_id}
                  className="kanban-status-tag"
                  style={{
                    backgroundColor: status.bg_color || '#ffffff',
                    color: status.text_color || '#000000',
                  }}
                >
                  {status.descricao}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}








