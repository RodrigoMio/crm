import { FormEvent, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { api } from '../services/api'
import './LandingPagePublic.css'

const LGPD_LABEL =
  'Autorizo o tratamento dos meus dados para fins de contato comercial conforme a política de privacidade do sistema.'

type PublicLp = {
  slug: string
  token: string
  titulo: string
  texto_principal: string
  texto_secundario: string
  font_size_principal: number
  font_size_secundaria: number
  background_color: string
  font_color_primary: string
  font_color_secondary: string
  products?: { produto_id: number; descricao: string }[]
}

export default function LandingPagePublic() {
  const { slug } = useParams()
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('+55 ')
  const [email, setEmail] = useState('')
  const [interesse, setInteresse] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [uf, setUf] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [aceite, setAceite] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const { data, isLoading } = useQuery<PublicLp>({
    queryKey: ['landing-page-public', slug],
    queryFn: async () => (await api.get(`/public/lp/${slug}`)).data,
    enabled: !!slug,
    retry: false,
  })

  const canSubmit = useMemo(
    () => !!nome.trim() && !!telefone.trim() && !!interesse.trim() && aceite,
    [aceite, interesse, nome, telefone],
  )

  const mutation = useMutation({
    mutationFn: async () => {
      return api.post('/public/lp/capture', {
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim() || undefined,
        lead_msg_interesse: interesse.trim(),
        slug,
        token: data?.token,
        products: selectedProducts.length > 0 ? selectedProducts : undefined,
        municipio: municipio.trim() || undefined,
        uf: uf.trim().toUpperCase() || undefined,
        lgpd_aceite: true,
        lgpd_data_aceite: new Date().toISOString(),
        lgpd_versao_texto: LGPD_LABEL,
      })
    },
    onSuccess: () => {
      setSuccess(true)
      setErrorMsg('')
      setNome('')
      setTelefone('+55 ')
      setEmail('')
      setInteresse('')
      setMunicipio('')
      setUf('')
      setSelectedProducts([])
      setAceite(false)
    },
    onError: (error: any) => {
      setErrorMsg(`Ops! Nao foi possivel enviar. ${error?.response?.data?.message || error.message}`)
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !data) return
    mutation.mutate()
  }

  if (isLoading) return <div className="lp-public-wrapper">Carregando...</div>

  if (!data) {
    return <div className="lp-public-wrapper">Landing page nao encontrada</div>
  }

  const toggleProduct = (id: number) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    )
  }

  const hasProducts = (data.products || []).length > 0
  const UF_OPTIONS = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
  ]

  return (
    <div className="lp-public-wrapper" style={{ background: data.background_color }}>
      <div className="lp-public-content">
        <h1
          className="lp-public-title"
          style={{ color: data.font_color_primary, fontSize: data.font_size_principal }}
        >
          {data.texto_principal}
        </h1>
        <p
          className="lp-public-subtitle"
          style={{ color: data.font_color_secondary, fontSize: data.font_size_secundaria }}
        >
          {data.texto_secundario}
        </p>

        {!success ? (
          <form onSubmit={handleSubmit} className="lp-public-form">
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome Completo"
              required
            />
            <input
              type="text"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="Telefone (Whatsapp)"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
            />
            <div className="lp-public-location">
              <input
                type="text"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value.toUpperCase())}
                placeholder="Município"
              />
              <select
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                aria-label="UF (opcional)"
              >
                <option value="">UF</option>
                {UF_OPTIONS.map((sigla) => (
                  <option key={sigla} value={sigla}>
                    {sigla}
                  </option>
                ))}
              </select>
            </div>
            {hasProducts && (
              <div className="lp-public-products">
                <label className="lp-products-title" style={{ color: data.font_color_secondary, marginBottom: 4 }}>
                  Selecione seus produtos de interesse
                </label>
                <div className="lp-public-chips">
                  {(data.products || []).map((p) => {
                    const active = selectedProducts.includes(p.produto_id)
                    return (
                      <button
                        key={p.produto_id}
                        type="button"
                        className={`lp-chip ${active ? 'active' : ''}`}
                        onClick={() => toggleProduct(p.produto_id)}
                        style={{
                          color: active ? data.background_color : data.font_color_secondary,
                          backgroundColor: active ? data.font_color_primary : 'transparent',
                        }}
                      >
                        {p.descricao}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            <textarea
              value={interesse}
              onChange={(e) => setInteresse(e.target.value)}
              placeholder="Informe sua regiao e detalhes do produto que procura"
              required
            />
            <label className="lp-check" style={{ color: data.font_color_secondary }}>
              <input type="checkbox" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
              {LGPD_LABEL}
            </label>
            <button
              type="submit"
              disabled={!canSubmit || mutation.isPending}
              style={{
                backgroundColor: data.font_color_primary,
                color: data.background_color,
              }}
            >
              {mutation.isPending ? 'Enviando...' : 'Enviar'}
            </button>
          </form>
        ) : (
          <div className="lp-success" style={{ color: data.font_color_secondary }}>
            <h2>Tudo certo, seu pedido foi enviado!</h2>
            <p>
              Ja estamos analisando os detalhes que voce nos passou. Em breve, nosso time comercial
              entrara em contato para te ajudar a fechar o melhor negocio.
            </p>
          </div>
        )}

        {errorMsg && <p className="lp-error">{errorMsg}</p>}
      </div>
    </div>
  )
}

