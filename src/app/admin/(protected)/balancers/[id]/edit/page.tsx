import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import BalancerForm from '@/components/BalancerForm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EditBalancerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const balancer = await prisma.balancer.findUnique({
    where: { id },
    include: { destinations: true }
  })

  if (!balancer) {
    redirect('/admin/dashboard')
  }

  // Format initialData to match what the form expects
  const initialData = {
    id: balancer.id,
    name: balancer.name,
    slug: balancer.slug,
    destinations: balancer.destinations.map(d => ({
      id: d.id,
      url: d.url,
      weight: d.weight
    }))
  }

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', margin: 0 }}>Editar Balanceador</h2>
        <Link href="/admin/dashboard" className="btn-primary">
          Voltar
        </Link>
      </header>

      <BalancerForm initialData={initialData} />
    </div>
  )
}
