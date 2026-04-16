import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import './LandingPages.css'
import ProductTagsInput from '../components/ProductTagsInput'

type LandingPage = {
  id: number
  titulo: string
  slug: string
  token: string
  texto_principal: string
  texto_secundario: string
  font_size_principal: number
  font_size_secundaria: number
  background_color: string
  font_color_primary: string
  font_color_secondary: string
  vendedor_id: number | null
  usuario_id_colaborador: number | null
  tipo_fluxo: 'VENDEDOR' | 'COMPRADOR'
  dominio_autorizado?: string | null
  active: boolean
  vendedor?: { id: number; nome: string }
  colaborador?: { id: number; nome: string }
}

type UserItem = { id: number; nome: string }

const initialForm = {
  titulo: '',
  slug: '',
  texto_principal: '',
  texto_secundario: '',
  font_size_principal: 42,
  font_size_secundaria: 20,
  background_color: '#4A4A4A',
  font_color_primary: '#72EDED',
  font_color_secondary: '#FFFFFF',
  vendedor_id: '',
  usuario_id_colaborador: '',
  tipo_fluxo: '' as '' | 'VENDEDOR' | 'COMPRADOR',
  dominio_autorizado: '',
  produtos: [] as number[],
}

export default function LandingPages() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<LandingPage | null>(null)
  const [slugError, setSlugError] = useState('')
  const [tipoFluxoError, setTipoFluxoError] = useState('')
  const [formData, setFormData] = useState(initialForm)
  const [showDocsModal, setShowDocsModal] = useState(false)
  const [docsLandingPage, setDocsLandingPage] = useState<LandingPage | null>(null)
  const [docsTab, setDocsTab] = useState<'HTML' | 'JS' | 'PROMPT'>('HTML')
  const [docsProducts, setDocsProducts] = useState<{ produto_id: number; descricao: string }[]>([])

  const isAgente = user?.perfil === 'AGENTE'

  const { data: landingPages = [], isLoading } = useQuery<LandingPage[]>({
    queryKey: ['landing-pages'],
    queryFn: async () => (await api.get('/landing-pages')).data,
  })

  const { data: agentes = [] } = useQuery<UserItem[]>({
    queryKey: ['agentes'],
    queryFn: async () => (await api.get('/users/agentes')).data,
    enabled: user?.perfil === 'ADMIN',
  })

  const selectedAgenteId = useMemo(() => {
    if (isAgente) return Number(user?.id)
    return formData.vendedor_id ? Number(formData.vendedor_id) : undefined
  }, [formData.vendedor_id, isAgente, user?.id])

  const { data: colaboradores = [] } = useQuery<UserItem[]>({
    queryKey: ['colaboradores-lp', selectedAgenteId],
    queryFn: async () => {
      if (!selectedAgenteId) return []
      const response = await api.get(`/users/colaboradores?agente_id=${selectedAgenteId}`)
      return response.data
    },
    enabled: !!selectedAgenteId,
  })

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editing) return api.patch(`/landing-pages/${editing.id}`, payload)
      return api.post('/landing-pages', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landing-pages'] })
      closeModal()
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async (id: number) => api.patch(`/landing-pages/${id}/toggle-active`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landing-pages'] }),
  })

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setSlugError('')
    setTipoFluxoError('')
    setFormData(initialForm)
  }

  const openCreate = () => {
    const base = { ...initialForm }
    if (isAgente) {
      base.vendedor_id = String(user?.id || '')
    }
    setFormData(base)
    setEditing(null)
    setShowModal(true)
  }

  const openEdit = (item: LandingPage) => {
    setEditing(item)
    setSlugError('')
    setTipoFluxoError('')
    setFormData({
      titulo: item.titulo,
      slug: item.slug,
      texto_principal: item.texto_principal,
      texto_secundario: item.texto_secundario,
      font_size_principal: item.font_size_principal,
      font_size_secundaria: item.font_size_secundaria,
      background_color: item.background_color,
      font_color_primary: item.font_color_primary,
      font_color_secondary: item.font_color_secondary,
      vendedor_id: item.vendedor_id ? String(item.vendedor_id) : '',
      usuario_id_colaborador: item.usuario_id_colaborador ? String(item.usuario_id_colaborador) : '',
      tipo_fluxo: item.tipo_fluxo,
      dominio_autorizado: item.dominio_autorizado || '',
      produtos: [],
    })
    setShowModal(true)

    // Carrega produtos vinculados para edição
    api.get(`/landing-pages/${item.id}/produtos`).then((res) => {
      const ids = (res.data || []).map((p: { produto_id: number }) => p.produto_id)
      setFormData((prev) => ({ ...prev, produtos: ids }))
    }).catch(() => {
      setFormData((prev) => ({ ...prev, produtos: [] }))
    })
  }

  const normalizeSlug = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

  const formatSlugInput = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')

  const handleSlugBlur = async () => {
    const slug = normalizeSlug(formData.slug)
    setFormData((prev) => ({ ...prev, slug }))
    if (!slug) return

    const response = await api.get('/landing-pages/check-slug', {
      params: { slug, exclude_id: editing?.id },
    })
    if (!response.data.available) {
      setSlugError('Esta chave já existe')
    } else {
      setSlugError('')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (slugError) return
    if (!formData.tipo_fluxo) {
      setTipoFluxoError('Selecione o tipo de fluxo')
      return
    }
    setTipoFluxoError('')

    // Remove 'produtos' do payload principal e envia apenas 'produtos_ids'
    const { produtos, ...base } = formData as any
    const payload = {
      ...base,
      slug: normalizeSlug(formData.slug),
      vendedor_id: isAgente
        ? Number(user?.id)
        : formData.vendedor_id
        ? Number(formData.vendedor_id)
        : undefined,
      usuario_id_colaborador: formData.usuario_id_colaborador
        ? Number(formData.usuario_id_colaborador)
        : undefined,
      font_size_principal: Number(formData.font_size_principal),
      font_size_secundaria: Number(formData.font_size_secundaria),
      produtos_ids: produtos && produtos.length > 0 ? produtos : undefined,
    }

    saveMutation.mutate(payload)
  }

  const openDocs = (item: LandingPage) => {
    setDocsLandingPage(item)
    setDocsTab('HTML')
    setShowDocsModal(true)
    api
      .get(`/landing-pages/${item.id}/produtos`)
      .then((res) => setDocsProducts((res.data || []) as { produto_id: number; descricao: string }[]))
      .catch(() => setDocsProducts([]))
  }

  const closeDocs = () => {
    setShowDocsModal(false)
    setDocsLandingPage(null)
  }

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      const temp = document.createElement('textarea')
      temp.value = value
      document.body.appendChild(temp)
      temp.select()
      document.execCommand('copy')
      document.body.removeChild(temp)
    }
  }

  const captureUrl = `${window.location.origin}/api/public/lp/capture`
  const docsHtmlSnippet = docsLandingPage
    ? `<!-- HTML pronto para copiar/colar. Idêntico aos campos da LP pública -->
<form action="${captureUrl}" method="POST" style="max-width:760px;margin:0 auto;padding:14px;border:1px solid rgba(255,255,255,0.28);border-radius:14px;background:rgba(0,0,0,0.16)">
  <input type="hidden" name="slug" value="${docsLandingPage.slug}" />
  <input type="hidden" name="token" value="${docsLandingPage.token}" />
  <input type="hidden" name="lgpd_aceite" value="true" />
  <input type="hidden" name="lgpd_versao_texto" value="Autorizo o tratamento dos meus dados para fins de contato comercial conforme a politica de privacidade do sistema." />
  <input type="hidden" name="lgpd_data_aceite" value="${new Date().toISOString()}" />

  <style>
    .lp-input, .lp-textarea, .lp-select { 
      width: 100%; border: 1px solid rgba(255,255,255,0.4); border-radius: 10px; 
      padding: 12px; font-size: 15px; color: #ffffff; background: rgba(255,255,255,0.08); 
      box-sizing: border-box; margin-bottom: 12px;
    }
    .lp-textarea { min-height: 100px; }
    .lp-row { display: grid; grid-template-columns: 1fr 140px; gap: 10px; }
    .lp-btn { border: 0; border-radius: 10px; padding: 12px; font-weight: 700; cursor: pointer; }
    .lp-chips { display: flex; flex-wrap: wrap; gap: 10px; margin: 6px 0 12px; }
    .lp-chip-input { display: none; }
    .lp-chip-label { 
      border: 1px solid gray; border-radius: 999px; padding: 6px 12px; 
      font-size: 14px; font-weight: 500; background: transparent; cursor: pointer;
      color: ${docsLandingPage.font_color_secondary};
    }
    .lp-chip-input:checked + .lp-chip-label {
      background: ${docsLandingPage.font_color_primary}; 
      color: ${docsLandingPage.background_color}; 
      font-weight: 700;
    }
  </style>

  <label>Nome</label>
  <input class="lp-input" type="text" name="nome" required />

  <label>WhatsApp</label>
  <input class="lp-input" type="text" name="telefone" required />

  <label>E-mail</label>
  <input class="lp-input" type="email" name="email" />

  <div class="lp-row">
    <div>
      <label>Município</label>
      <input class="lp-input" type="text" name="municipio" />
    </div>
    <div>
      <label>UF</label>
      <select class="lp-select" name="uf">
        <option value="">UF</option>
        <option>AC</option>
        <option>AL</option>
        <option>AP</option>
        <option>AM</option>
        <option>BA</option>
        <option>CE</option>
        <option>DF</option>
        <option>ES</option>
        <option>GO</option>
        <option>MA</option>
        <option>MT</option>
        <option>MS</option>
        <option>MG</option>
        <option>PA</option>
        <option>PB</option>
        <option>PR</option>
        <option>PE</option>
        <option>PI</option>
        <option>RJ</option>
        <option>RN</option>
        <option>RS</option>
        <option>RO</option>
        <option>RR</option>
        <option>SC</option>
        <option>SP</option>
        <option>SE</option>
        <option>TO</option>
      </select>
    </div>
  </div>

  ${docsProducts.length > 0 ? `<div>
    <label style="display:block;margin:4px 0 4px;color:${docsLandingPage.font_color_secondary}">Selecione seus produtos de interesse</label>
    <div class="lp-chips">
      ${docsProducts
        .map(
          (p) =>
            `<input class="lp-chip-input" id="p_${p.produto_id}" type="checkbox" name="products[]" value="${p.produto_id}" />
             <label class="lp-chip-label" for="p_${p.produto_id}">${p.descricao}</label>`,
        )
        .join('')}
    </div>
  </div>` : ''}

  <label>Mensagem de Interesse</label>
  <textarea class="lp-textarea" name="lead_msg_interesse" required></textarea>

  <label>
    <input type="checkbox" required checked />
    Autorizo o tratamento dos meus dados para fins de contato comercial conforme a politica de privacidade do sistema.
  </label>

  <button class="lp-btn" type="submit" style="background:${docsLandingPage.font_color_primary};color:${docsLandingPage.background_color}">Enviar</button>
</form>

<!-- Observacoes:
1) products (opcional): somente IDs vinculados a esta LP sao aceitos. Caso algum ID nao pertença a LP, a API retorna 400 com mensagem "Produto [id] invalido" e nada e salvo.
2) municipio/uf (opcionais): uf deve ser uma das 27 siglas BR (sempre maiuscula). -->
`
    : ''

  const docsJsSnippet = docsLandingPage
    ? `const payload = {
  nome: "Nome do cliente",
  telefone: "+5534999999999",
  email: "cliente@email.com",
  lead_msg_interesse: "Regiao, produto e detalhes de interesse",
  slug: "${docsLandingPage.slug}",
  token: "${docsLandingPage.token}",
  // OPCIONAIS
  products: [/* IDs de produtos vinculados a esta LP, por ex.: 101, 202 */],
  municipio: "BELO HORIZONTE",
  uf: "MG",
  lgpd_aceite: true,
  lgpd_data_aceite: new Date().toISOString(),
  lgpd_ip_origem: "",
  lgpd_versao_texto: "Autorizo o tratamento dos meus dados para fins de contato comercial conforme a politica de privacidade do sistema."
}

fetch("${captureUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(payload)
})
  .then((response) => response.json())
  .then((data) => console.log("Sucesso:", data))
  .catch(async (error) => {
    // Validações comuns:
    // - 400 "Produto [id] invalido" quando algum products[] nao pertence a LP
    // - 400 para campos obrigatorios ausentes (nome, telefone, lead_msg_interesse, slug, token)
    // - 403 quando dominio de origem nao esta autorizado
    console.error("Erro:", error)
  })`
    : ''

  const docsPromptIa = docsLandingPage
    ? `Você é uma IA desenvolvedora. Gere um formulário web completo que envie dados via POST JSON para a API pública de captura de leads.

Requisitos de integração
- Método: POST
- URL: ${captureUrl}
- Headers: Content-Type: application/json

Campos do formulário
- nome (string) — obrigatório
- telefone (string) — obrigatório. Formato E.164 (ex.: +5531999999999). Normalizar/remover máscara antes de enviar.
- email (string) — opcional
- lead_msg_interesse (string) — obrigatório. Textarea.
- slug (string) — obrigatório. Valor fixo: "${docsLandingPage.slug}"
- token (string) — obrigatório. Valor fixo: "${docsLandingPage.token}"
- products (array<number>) — opcional. Seleção múltipla dos produtos listados abaixo; enviar somente IDs válidos.
- municipio (string) — opcional. Texto livre. Se preenchido, enviar exatamente como foi digitado, em maiúsculas se possível.
- uf (string) — opcional. Somente uma das 27 siglas: AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO. Normalizar para maiúsculas.
- lgpd_aceite (boolean) — obrigatório. true quando o usuário marcar o checkbox de aceite.
- lgpd_data_aceite (string ISO 8601) — obrigatório. Preencher com new Date().toISOString() no momento do envio.
- lgpd_versao_texto (string) — obrigatório. Texto de aceite abaixo.

Texto de Opt-in (exibir com checkbox obrigatório)
"Autorizo o tratamento dos meus dados para fins de contato comercial conforme a politica de privacidade do sistema."

Produtos de interesse (multi-seleção)
Renderize como chips ou checkboxes. Ao enviar, envie somente IDs dos itens selecionados no array products. Lista (código – descrição), ordenada alfabeticamente:
${(docsProducts || [])
  .map((p) => `- ${p.produto_id} - ${p.descricao}`)
  .join('\n')}

Comportamento e validações no front
- Validar campos obrigatórios antes do envio.
- Normalizar telefone para E.164.
- Normalizar UF para maiúsculas e restringir às 27 siglas.
- Não enviar campos opcionais vazios (email, municipio, uf, products).

Tratamento de resposta
- Sucesso: exibir mensagem de confirmação amigável.
- Erros comuns:
  - 400 com mensagem "Produto [id] invalido" quando algum ID de products não pertence à LP — orientar o usuário a corrigir a seleção.
  - 400 para campos obrigatórios ausentes/telefone inválido — exibir mensagens claras.
  - 403 quando o domínio não está autorizado — exibir mensagem explicativa.

Estilo/implementação
- Você pode escolher a stack (HTML/CSS/JS, React, etc.).
- Mantenha UX clara e acessível. Chips/checkboxes para multi-seleção de produtos.
- O botão de enviar deve desabilitar durante a requisição.

Payload de exemplo (JSON)
{
  "nome": "Nome do cliente",
  "telefone": "+5531999999999",
  "email": "cliente@email.com",
  "lead_msg_interesse": "Região e detalhes do produto",
  "slug": "${docsLandingPage.slug}",
  "token": "${docsLandingPage.token}",
  "products": [/* IDs selecionados, ex.: ${docsProducts.slice(0, 2).map(p=>p.produto_id).join(', ')} */],
  "municipio": "BELO HORIZONTE",
  "uf": "MG",
  "lgpd_aceite": true,
  "lgpd_data_aceite": "<agora em ISO>",
  "lgpd_versao_texto": "Autorizo o tratamento dos meus dados para fins de contato comercial conforme a politica de privacidade do sistema."
}

Entregável
- Código completo pronto para uso, com validações solicitadas e tratamento de estados (carregando/sucesso/erro).`
    : ''
  const configuredDomains = (docsLandingPage?.dominio_autorizado || '')
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)

  return (
    <div className="landing-pages-container">
      <div className="page-header">
        <h1>Landing Pages</h1>
        <button className="btn-primary" onClick={openCreate}>
          Nova Landing page
        </button>
      </div>

      {isLoading ? (
        <div>Carregando...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Titulo</th>
                <th>Slug / Token</th>
                <th>Agente</th>
                <th>Colaborador</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Ver</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {landingPages.map((item) => (
                <tr key={item.id}>
                  <td>{item.titulo}</td>
                  <td>
                    <div>{item.slug}</div>
                    <small>{item.token}</small>
                  </td>
                  <td>{item.vendedor?.nome || '-'}</td>
                  <td>{item.colaborador?.nome || '-'}</td>
                  <td>{item.tipo_fluxo}</td>
                  <td>{item.active ? 'Ativa' : 'Inativa'}</td>
                  <td>
                    <a href={`/landing-page/${item.slug}`} target="_blank" rel="noreferrer">
                      Ver pagina
                    </a>
                  </td>
                  <td>
                    <button className="btn-edit" onClick={() => openEdit(item)}>
                      Editar
                    </button>
                    <button className="btn-secondary" onClick={() => openDocs(item)}>
                      Instrucoes
                    </button>
                    <button className="btn-secondary" onClick={() => toggleMutation.mutate(item.id)}>
                      {item.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="lp-modal-overlay" onClick={closeModal}>
          <div className="lp-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Nova Landing Page para captacao de leads</h2>
            <p className="lp-subtitle">
              Crie o registro de landing pages e defina como o Lead entrara em seu board. A Landing
              page sera acessada pelo link /landing-page/[slug]
            </p>

            <form onSubmit={handleSubmit} className="lp-form-grid">
              <section className="lp-section full">
                <h3>Identificacao da Landing Page no sistema</h3>
                <div className="lp-grid-2">
                  <div className="form-group">
                    <label>Nome da landing page *</label>
                    <input
                      required
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Identificação (slug) *</label>
                    <input
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: formatSlugInput(e.target.value) })}
                      onBlur={handleSlugBlur}
                    />
                    <small>Somente letras e numeros. Espacos viram hifen.</small>
                    <small>/landing-page/{formData.slug || '[slug digitado]'}</small>
                    {slugError && <small className="error">{slugError}</small>}
                  </div>
                </div>
              </section>

              <section className="lp-section full">
                <h3>Exibicao para o usuario</h3>
                <div className="lp-grid-4">
                  <div className="form-group col-3">
                    <label>Texto do titulo *</label>
                    <input
                      required
                      value={formData.texto_principal}
                      onChange={(e) => setFormData({ ...formData, texto_principal: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Tamanho da fonte (px)</label>
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={formData.font_size_principal}
                      onChange={(e) =>
                        setFormData({ ...formData, font_size_principal: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <div className="lp-grid-4">
                  <div className="form-group col-3">
                    <label>Texto do subtitulo *</label>
                    <textarea
                      required
                      value={formData.texto_secundario}
                      onChange={(e) => setFormData({ ...formData, texto_secundario: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Tamanho da fonte do subtitulo (px)</label>
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={formData.font_size_secundaria}
                      onChange={(e) =>
                        setFormData({ ...formData, font_size_secundaria: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </section>

              <section className="lp-section full">
                <h3>Layout</h3>
                <div className="lp-grid-3">
                  <div className="form-group">
                    <label>Cor de fundo</label>
                    <div className="color-row">
                      <input
                        type="color"
                        value={formData.background_color}
                        onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      />
                      <input
                        value={formData.background_color}
                        onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Cor principal</label>
                    <div className="color-row">
                      <input
                        type="color"
                        value={formData.font_color_primary}
                        onChange={(e) =>
                          setFormData({ ...formData, font_color_primary: e.target.value })
                        }
                      />
                      <input
                        value={formData.font_color_primary}
                        onChange={(e) =>
                          setFormData({ ...formData, font_color_primary: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Cor secundaria</label>
                    <div className="color-row">
                      <input
                        type="color"
                        value={formData.font_color_secondary}
                        onChange={(e) =>
                          setFormData({ ...formData, font_color_secondary: e.target.value })
                        }
                      />
                      <input
                        value={formData.font_color_secondary}
                        onChange={(e) =>
                          setFormData({ ...formData, font_color_secondary: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="lp-section full">
                <h3>Informacoes de Incorporacao do Lead</h3>
                <div className="lp-grid-3">
                  <div className="form-group">
                    <label>Adicionar ao boarde do Agente</label>
                    <select
                      disabled={isAgente}
                      value={isAgente ? String(user?.id || '') : formData.vendedor_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vendedor_id: e.target.value,
                          usuario_id_colaborador: '',
                        })
                      }
                    >
                      <option value="">Sem agente</option>
                      {agentes.map((agente) => (
                        <option key={agente.id} value={agente.id}>
                          {agente.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Adicionar ao board do Colaborador</label>
                    <select
                      value={formData.usuario_id_colaborador}
                      onChange={(e) =>
                        setFormData({ ...formData, usuario_id_colaborador: e.target.value })
                      }
                    >
                      <option value="">Sem colaborador</option>
                      {colaboradores.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tipo de fluxo *</label>
                    <div className="flow-toggle">
                      <button
                        type="button"
                        className={`flow-toggle-btn ${formData.tipo_fluxo === 'VENDEDOR' ? 'active' : ''}`}
                        onClick={() => {
                          setFormData({ ...formData, tipo_fluxo: 'VENDEDOR' })
                          setTipoFluxoError('')
                        }}
                      >
                        Vendedor
                      </button>
                      <button
                        type="button"
                        className={`flow-toggle-btn ${formData.tipo_fluxo === 'COMPRADOR' ? 'active' : ''}`}
                        onClick={() => {
                          setFormData({ ...formData, tipo_fluxo: 'COMPRADOR' })
                          setTipoFluxoError('')
                        }}
                      >
                        Comprador
                      </button>
                    </div>
                    {tipoFluxoError && <small className="error">{tipoFluxoError}</small>}
                  </div>
                </div>
              </section>

              <section className="lp-section full">
                <h3>Produtos de interesse (opcional)</h3>
                <div className="lp-grid-1">
                  <div className="form-group">
                    <ProductTagsInput
                      value={formData.produtos}
                      onChange={(ids) => setFormData({ ...formData, produtos: ids })}
                      isAdmin={String(user?.perfil).toUpperCase() === 'ADMIN'}
                      allowCreateNew={false}
                      showViewAllButton={false}
                      label="Produtos de interesse"
                      filterProdutoTipoId={1}
                    />
                    <small>Os produtos selecionados serão exibidos na Landing Page pública como opções de interesse.</small>
                  </div>
                </div>
              </section>

              <section className="lp-section full">
                <h3>Informacoes de seguranca</h3>
                <div className="lp-grid-1">
                  <div className="form-group">
                    <label>Dominio(s) autorizado(s)</label>
                    <input
                      value={formData.dominio_autorizado}
                      onChange={(e) =>
                        setFormData({ ...formData, dominio_autorizado: e.target.value })
                      }
                      placeholder="meusite.com.br; landingpage.vendas.com.br"
                    />
                    <small>
                      Informe o(s) dominio(s) onde a landing page sera publicada, separados por ponto
                      e virgula. Somente dominios informados serao autorizados a usar a API de Lead.
                    </small>
                  </div>
                </div>
              </section>

              <div className="form-actions full">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saveMutation.isPending || !!slugError}>
                  {saveMutation.isPending ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDocsModal && docsLandingPage && (
        <div className="lp-docs-overlay" onClick={closeDocs}>
          <div className="lp-docs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lp-docs-header">
              <h2>Documentacao de API e Integracao Externa</h2>
              <button className="btn-secondary" onClick={closeDocs}>
                Fechar
              </button>
            </div>

            <div className="lp-docs-keys">
              <div className="lp-docs-key-row">
                <strong>Slug</strong>
                <code>{docsLandingPage.slug}</code>
                <button className="btn-primary" onClick={() => copyText(docsLandingPage.slug)}>
                  Copiar
                </button>
              </div>
              <div className="lp-docs-key-row">
                <strong>Token</strong>
                <code>{docsLandingPage.token}</code>
                <button className="btn-primary" onClick={() => copyText(docsLandingPage.token)}>
                  Copiar
                </button>
              </div>
            </div>

            <div className="lp-docs-tabs">
              <button
                className={`lp-docs-tab ${docsTab === 'HTML' ? 'active' : ''}`}
                onClick={() => setDocsTab('HTML')}
              >
                HTML
              </button>
              <button
                className={`lp-docs-tab ${docsTab === 'JS' ? 'active' : ''}`}
                onClick={() => setDocsTab('JS')}
              >
                JavaScript
              </button>
              <button
                className={`lp-docs-tab ${docsTab === 'PROMPT' ? 'active' : ''}`}
                onClick={() => setDocsTab('PROMPT')}
              >
                PROMPT IA
              </button>
            </div>

            {docsTab === 'HTML' && (
              <div className="lp-docs-section">
                <p>
                  Exemplo para sites simples com formulario HTML puro apontando para a API publica.
                </p>
                <pre>{docsHtmlSnippet}</pre>
                <div style={{ marginTop: 8 }}>
                  <button className="btn-primary" onClick={() => copyText(docsHtmlSnippet)}>
                    Copiar
                  </button>
                </div>
              </div>
            )}

            {docsTab === 'JS' && (
              <div className="lp-docs-section">
                <p>Exemplo para desenvolvedores usando fetch com envio em JSON.</p>
                <pre>{docsJsSnippet}</pre>
                <div style={{ marginTop: 8 }}>
                  <button className="btn-primary" onClick={() => copyText(docsJsSnippet)}>
                    Copiar
                  </button>
                </div>
              </div>
            )}

            {docsTab === 'PROMPT' && (
              <div className="lp-docs-section">
                <p>Use este prompt em sua IA (ex.: Lovable) para gerar um formulario integrado.</p>
                <pre>{docsPromptIa}</pre>
                <div style={{ marginTop: 8 }}>
                  <button className="btn-primary" onClick={() => copyText(docsPromptIa)}>
                    Copiar
                  </button>
                </div>
              </div>
            )}

            <div className="lp-docs-footer">
              {configuredDomains.length > 0 && (
                <p className="lp-docs-security-warning">
                  Seguranca Ativa: Esta Landing Page so aceitara leads vindos dos dominios
                  configurados: {configuredDomains.join('; ')}.
                </p>
              )}
              <strong>Aviso LGPD:</strong> Ao integrar via site proprio, voce e responsavel por exibir
              o texto de aceite: Autorizo o tratamento dos meus dados para fins de contato comercial
              conforme a politica de privacidade do sistema. O campo <code>lgpd_aceite</code> deve ser
              enviado obrigatoriamente como <code>true</code>.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

