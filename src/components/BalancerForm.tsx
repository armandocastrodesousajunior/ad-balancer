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
    destinations: Destination[]
  }
}

export default function BalancerForm({ initialData }: BalancerFormProps) {
  const router = useRouter()
  const isEditing = !!initialData

  const [name, setName] = useState(initialData?.name || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [destinations, setDestinations] = useState<Destination[]>(
    initialData?.destinations || [
      { id: '1', url: '', weight: 50 },
      { id: '2', url: '', weight: 50 }
    ]
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const addDestination = () => {
    const currentCount = destinations.length
    if (currentCount >= 10) {
      setError('Máximo de 10 destinos permitidos.')
      return
    }

    const newDest = { id: Date.now().toString(), url: '', weight: 0 }
    const newDests = [...destinations, newDest]
    distributeWeightsEvenly(newDests)
  }

  const removeDestination = (id: string) => {
    if (destinations.length <= 2) {
      setError('É necessário no mínimo 2 destinos.')
      return
    }
    const newDests = destinations.filter(d => d.id !== id)
    distributeWeightsEvenly(newDests)
  }

  const distributeWeightsEvenly = (dests: Destination[]) => {
    const baseWeight = Math.floor(100 / dests.length)
    let remainder = 100 - (baseWeight * dests.length)

    const updated = dests.map(d => {
      let w = baseWeight
      if (remainder > 0) {
        w += 1
        remainder -= 1
      }
      return { ...d, weight: w }
    })
    setDestinations(updated)
    setError('')
  }

  const handleWeightChange = (index: number, newWeight: number) => {
    const oldWeight = destinations[index].weight
    const difference = newWeight - oldWeight
    
    const newDests = [...destinations]
    newDests[index].weight = newWeight

    let remainingDiff = difference
    
    // Adjust other weights
    const otherIndices = newDests
      .map((_, i) => i)
      .filter(i => i !== index)
      .sort((a, b) => newDests[b].weight - newDests[a].weight) // Reduce from largest first

    for (const i of otherIndices) {
      if (remainingDiff === 0) break
      
      const current = newDests[i].weight
      if (remainingDiff > 0) {
        // We increased the main slider, need to decrease others
        const maxDecrease = current // can't go below 0
        const decrease = Math.min(remainingDiff, maxDecrease)
        newDests[i].weight -= decrease
        remainingDiff -= decrease
      } else {
        // We decreased main slider, need to increase others
        const maxIncrease = 100 - current
        const increase = Math.min(Math.abs(remainingDiff), maxIncrease)
        newDests[i].weight += increase
        remainingDiff += increase
      }
    }

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

    const totalWeight = destinations.reduce((sum, d) => sum + d.weight, 0)
    if (totalWeight !== 100) {
      setError('A soma das porcentagens deve ser exatamente 100%.')
      setLoading(false)
      return
    }

    const payload = {
      name,
      slug: slug.replace(/[^a-z0-9-]/g, '').toLowerCase(),
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

          <div>
            <div className={styles.destHeader}>
              <h3>Destinos de Tráfego</h3>
              <button type="button" onClick={addDestination} className={styles.addBtn}>
                + Adicionar Destino
              </button>
            </div>

            <div className={styles.destList}>
              {destinations.map((dest, index) => (
                <div key={dest.id} className={styles.destCard}>
                  <div className={styles.destHeaderRow}>
                    <span className={styles.destNumber}>Destino {index + 1}</span>
                    {destinations.length > 2 && (
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
                    <span className={styles.weightDisplay}>{dest.weight}%</span>
                  </div>
                </div>
              ))}
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
