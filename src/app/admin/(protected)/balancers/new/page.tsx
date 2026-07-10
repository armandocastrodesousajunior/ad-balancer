import BalancerForm from '@/components/BalancerForm'
import Link from 'next/link'

export default function NewBalancerPage() {
  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', margin: 0 }}>Criar Novo Balanceador</h2>
        <Link href="/admin/dashboard" className="btn-primary">
          Voltar
        </Link>
      </header>
      <BalancerForm />
    </div>
  )
}
