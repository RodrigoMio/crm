import { useEffect } from 'react'
import './BestPracticesModal.css'

interface BestPracticesModalProps {
  onClose: () => void
}

export default function BestPracticesModal({ onClose }: BestPracticesModalProps) {
  // Fechar com tecla ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div className="best-practices-modal-overlay" onClick={onClose}>
      <div className="best-practices-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="best-practices-modal-header">
          <div className="best-practices-modal-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              <path d="M8 7h8"></path>
              <path d="M8 11h8"></path>
            </svg>
            <h2>Manual do Agente de Negócios: Padrão de Atendimento Canal do Campo</h2>
          </div>
          <button onClick={onClose} className="best-practices-modal-close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="best-practices-modal-body">
          <p className="best-practices-intro">
            Este manual estabelece as diretrizes de fluxo e abordagem para garantir que nossa base de leads seja trabalhada com excelência e profissionalismo.
          </p>

          <section className="best-practices-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              1. O Funil de Vendas (Kanban)
            </h3>
            <p>O sucesso da operação depende da organização do seu painel. Cada coluna tem uma regra clara:</p>
            <ol className="best-practices-list">
              <li>
                <strong>NOVOS (Backlog):</strong> Estoque de leads distribuídos pela gestão. Você deve "puxar" os leads daqui para iniciar seu trabalho.
              </li>
              <li>
                <strong>Prospecção:</strong> Leads selecionados para o trabalho do dia ou da semana. O contato está em andamento (tentativa de conexão).
              </li>
              <li>
                <strong>Em Negociação:</strong> Lead "quente". Demonstrou interesse real, solicitou preços ou condições. Prioridade Máxima.
              </li>
              <li>
                <strong>Não Responde:</strong> Tentativas de contato sem sucesso (máximo 4 vezes).
              </li>
              <li>
                <strong>Não é o Momento:</strong> Lead com perfil, mas sem interesse imediato. Obrigatório agendar recontato.
              </li>
              <li>
                <strong>VENDEU:</strong> Venda concluída! Agendar pós-venda para futura recompra.
              </li>
              <li>
                <strong>Perdido:</strong> Descarte (número errado, sem interesse ou falha nas 4 tentativas).
              </li>
            </ol>
          </section>

          <section className="best-practices-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18h6"></path>
                <path d="M10 22h4"></path>
                <path d="M12 2v20"></path>
                <path d="M12 6a4 4 0 0 1 4 4v4a4 4 0 0 1-4 4 4 4 0 0 1-4-4v-4a4 4 0 0 1 4-4z"></path>
              </svg>
              2. A Cultura da Anotação (Memória do Cliente)
            </h3>
            <p>O histórico é a sua ferramenta mais poderosa. Sem anotações, você perde a chance de personalizar o atendimento e o Canal do Campo perde a inteligência sobre o cliente.</p>
            <ul className="best-practices-list best-practices-list-bullet">
              <li>
                <strong>O que anotar:</strong> Preferências de compra (raças, regiões), objeções (preço, frete), e detalhes do perfil (produtor, investidor, melhor horário para falar).
              </li>
              <li>
                <strong>Regra:</strong> Toda interação gera uma nota. Releia o histórico antes de cada novo contato.
              </li>
            </ul>
          </section>

          <section className="best-practices-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              3. Modelos de Abordagem Standard
            </h3>
            
            <div className="best-practices-scenario">
              <h4>Cenário A: Lead com Demanda Identificada</h4>
              <div className="best-practices-quote">
                Olá {'{Nome}'}, tudo bem? Sou o {'{Seu Nome}'}, Agente de Negócios do Canal do Campo. Estou assumindo a gestão do seu contato em nossa base e vi que você demonstrou interesse no {'{Lote/Produto}'}; você prefere que eu envie as informações técnicas por aqui ou podemos falar rapidamente por telefone?
              </div>
            </div>

            <div className="best-practices-scenario">
              <h4>Cenário B: Base Ampla (Curadoria e Atualização)</h4>
              <div className="best-practices-quote">
                Olá {'{Nome}'}, como vai? Sou o {'{Seu Nome}'}, Agente de Negócios parceiro do Canal do Campo. Estou assumindo a gestão do seu contato em nossa base e gostaria de atualizar seu perfil para te enviar apenas oportunidades que façam sentido para o seu negócio; hoje seu foco maior está em Pecuária, Agricultura ou Investimento em Terras?
              </div>
            </div>
          </section>

          <section className="best-practices-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              4. Regras Operacionais (Instruções para o Agente)
            </h3>
            
            <div className="best-practices-subsection">
              <h4>A. Gestão do "Não Responde" (Regra das 4 Tentativas)</h4>
              <p>Não deixe o lead parado. Siga este ciclo de 4 tentativas em dias/horários diferentes:</p>
              <ul className="best-practices-list best-practices-list-bullet best-practices-list-indent">
                <li><strong>Tentativa 1:</strong> Ligação + WhatsApp de apresentação.</li>
                <li><strong>Tentativa 2:</strong> Envio de uma oferta destaque.</li>
                <li><strong>Tentativa 3:</strong> Áudio curto de acompanhamento.</li>
                <li><strong>Tentativa 4:</strong> Mensagem de encerramento.</li>
                <li><strong>Resultado:</strong> Sem resposta na 4ª tentativa? Mover para PERDIDO.</li>
              </ul>
            </div>

            <div className="best-practices-subsection">
              <h4>B. O Compromisso no "Não é o Momento"</h4>
              <p>Nunca mova um lead para esta coluna sem criar uma Tarefa/Compromisso no CRM com data definida para o retorno.</p>
            </div>

            <div className="best-practices-subsection">
              <h4>C. Identidade Visual e Autoridade</h4>
              <p>Sempre se identifique como: "Agente de Negócios ligado ao Canal do Campo". Use apenas materiais e catálogos oficiais.</p>
            </div>
          </section>

          <section className="best-practices-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4"></polyline>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
              5. Checklist Diário do Agente
            </h3>
            <ol className="best-practices-list">
              <li>Revisar compromissos e ler as anotações dos leads do dia.</li>
              <li>Puxar novos leads do Backlog (NOVOS) para a semana.</li>
              <li>Priorizar quem está Em Negociação.</li>
              <li>Atualizar todos os históricos e higienizar a coluna Não Responde.</li>
            </ol>
          </section>

          <div className="best-practices-footer">
            <p>Manual desenvolvido para a equipe de Agentes de Negócios - Canal do Campo.</p>
          </div>
        </div>
      </div>
    </div>
  )
}




