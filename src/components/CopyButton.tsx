'use client'

import { useState, useEffect } from 'react'
import styles from './copyButton.module.css'

export default function CopyButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    // Get the base URL (e.g., http://localhost:3000)
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  const handleCopy = async () => {
    const fullUrl = `${origin}/${slug}`
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Falha ao copiar:', err)
    }
  }

  // Prevent hydration mismatch by not rendering the full URL on server if we rely on window
  // But we can just use the button with the handler.
  
  return (
    <button onClick={handleCopy} className={styles.copyBtn} title="Copiar link do balanceador">
      {copied ? 'Copiado!' : 'Copiar Link'}
    </button>
  )
}
