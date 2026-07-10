'use client'

import { useState } from 'react'
import { login } from '@/app/actions/auth'
import styles from './login.module.css'

export default function AdminLogin() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const res = await login(formData)
    
    if (res?.error) {
      setError(res.error)
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={`glass ${styles.loginBox}`}>
        <h2>Ad Balancer</h2>
        <p className="text-muted">Insira seu token de acesso para gerenciar suas campanhas e tráfego.</p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input 
              type="password" 
              name="token" 
              placeholder="Token de Acesso" 
              className="input-field" 
              required 
            />
          </div>
          
          {error && <div className={styles.error}>{error}</div>}
          
          <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? 'Verificando...' : 'Acessar Painel'}
          </button>
        </form>
      </div>
    </div>
  )
}
