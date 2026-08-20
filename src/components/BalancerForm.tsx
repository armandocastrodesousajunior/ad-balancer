'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBalancer, updateBalancer } from '@/app/actions/balancer'
import styles from './balancerForm.module.css'

interface Destination {
  id: string
  url: string
  weight: number
}

interface BalancerFormProps {
  initialData?: {
    id: string
    name: string
    slug: string
    metaPixelId?: string | null
    metaPixelEvent?: string | null
    metaTitle?: string | null
    metaDescription?: string | null
    destinations: Destination[]
  }
}

const META_EVENTS = [
  'PageView',
  'Purchase',
  'Lead',
  'AddToCart',
  'InitiateCheckout',
  'CompleteRegistration',
  'Contact',
  'Schedule',
  'ViewContent'
]

export default function BalancerForm({ initialData }: BalancerFormProps) {
  const router = useRouter()
  const isEditing = !!initialData

  const [name, setName] = useState(initialData?.name || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  
  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle || '')
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription || '')

  const [metaPixelId, setMetaPixelId] = useState(initialData?.metaPixelId || '')
  const [metaPixelEvent, setMetaPixelEvent] = useState(initialData?.metaPixelEvent || 'PageView')
  const [destinations, setDestinations] = useState<Destination[]>(
    initialData?.destinations || [
      { id: '1', url: '', weight: 1 },
      { id: '2', url: '', weight: 1 }
    ]
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const totalWeight = destinations.reduce((sum, d) => sum + d.weight, 0)

  const addDestination = () => {
    const newDest = { id: Date.now().toString(), url: '', weight: 1 }
    setDestinations([...destinations, newDest])
    setError('')
  }

  const removeDestination = (id: string) => {
    if (destinations.length <= 1) {
      setError('É necessário no mínimo 1 destino.')
      return
    }
    setDestinations(destinations.filter(d => d.id !== id))
    setError('')
  }

  const handleWeightChange = (index: number, newWeight: number) => {
    const newDests = [...destinations]
    newDests[index].weight = newWeight
    setDestinations(newDests)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!name || !slug) {
      setError('Preencha o nome e a URL final.')
      setLoading(false)
      return
    }

    const invalidDest = destinations.find(d => !d.url || !d.url.startsWith('http'))
    if (invalidDest) {
      setError('Todos os destinos devem ser URLs válidas começando com http:// ou https://')
      setLoading(false)
      return
    }

    if (totalWeight <= 0) {
      setError('A soma dos pesos não pode ser zero.')
      setLoading(false)
      return
    }

    const payload = {
      name,
      slug: slug.replace(/[^a-z0-9-]/g, '').toLowerCase(),
      metaTitle: metaTitle.trim() || null,
      metaDescription: metaDescription.trim() || null,
      metaPixelId: metaPixelId.trim() || null,
      metaPixelEvent,
      destinations: destinations.map(d => ({ url: d.url, weight: d.weight }))
    }

    let res;
    if (isEditing && initialData?.id) {
      res = await updateBalancer(initialData.id, payload)
    } else {
      res = await createBalancer(payload)
    }
    
    if (res?.error) {
      setError(res.error)
      setLoading(false)
    } else {
      router.push('/admin/dashboard')
    }
  }

  return (
    <div className={`glass ${styles.formContainer}`}>
      {error && <div className={styles.error}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className={styles.inputGroup}>
              <label>Nome da Campanha</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Ex: Lançamento E-book" 
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Link do Balanceador (URL Final)</label>
              <div className={styles.slugInput}>
                <span className={styles.domainPrefix}>seusite.com/</span>
                <input 
                  type="text" 
                  className={`input-field ${styles.slugField}`} 
                  placeholder="lancamento-ebook" 
                  value={slug}
                  onChange={e => setSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase())}
                  required
                />
              </div>
            </div>
          </div>

          <div style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Aparência do Link (Opcional)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className={styles.inputGroup}>
                <label>Título do Link (Aparece no WhatsApp, Navegador, etc)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: Oferta Exclusiva - Meu Produto" 
                  value={metaTitle}
                  onChange={e => setMetaTitle(e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Descrição do Link</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: Clique aqui e aproveite a promoção imperdível válida somente hoje!" 
                  value={metaDescription}
                  onChange={e => setMetaDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ padding: '1.5rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Rastreamento (Pixel da Meta)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className={styles.inputGroup}>
                <label>ID do Pixel (Opcional)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: 123456789012345" 
                  value={metaPixelId}
                  onChange={e => setMetaPixelId(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Evento de Disparo</label>
                <select 
                  className="input-field"
                  value={metaPixelEvent}
                  onChange={e => setMetaPixelEvent(e.target.value)}
                  disabled={!metaPixelId}
                >
                  {META_EVENTS.map(ev => (
                    <option key={ev} value={ev} style={{ color: '#000' }}>{ev}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className={styles.destHeader}>
              <h3>Destinos de Tráfego</h3>
              <button type="button" onClick={addDestination} className={styles.addBtn}>
                + Adicionar Destino
              </button>
            </div>

            <div className={styles.destList}>
              {destinations.map((dest, index) => {
                const percentage = totalWeight > 0 ? ((dest.weight / totalWeight) * 100).toFixed(1) : '0.0'
                
                return (
                  <div key={dest.id} className={styles.destCard}>
                    <div className={styles.destHeaderRow}>
                      <span className={styles.destNumber}>Destino {index + 1}</span>
                      {destinations.length > 1 && (
                        <button type="button" onClick={() => removeDestination(dest.id)} className={styles.removeBtn}>
                          Remover
                        </button>
                      )}
                    </div>
                    
                    <input 
                      type="url" 
                      className="input-field" 
                      placeholder="https://pagina-de-captura-A.com" 
                      value={dest.url}
                      onChange={e => {
                        const newDests = [...destinations]
                        newDests[index].url = e.target.value
                        setDestinations(newDests)
                      }}
                      required
                    />

                    <div className={styles.sliderContainer}>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={dest.weight} 
                        className={styles.slider}
                        onChange={e => handleWeightChange(index, parseInt(e.target.value))}
                      />
                      <span className={styles.weightDisplay}>Peso: {dest.weight} ({percentage}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className={styles.submitRow}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Balanceador')}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
