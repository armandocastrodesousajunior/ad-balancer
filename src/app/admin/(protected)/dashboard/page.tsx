import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import CopyButton from '@/components/CopyButton'
import styles from './dashboard.module.css'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const balancers = await prisma.balancer.findMany({
    include: {
      destinations: true,
      _count: {
        select: { accessLogs: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h2>Seus Balanceadores</h2>
        <Link href="/admin/balancers/new" className="btn-primary">
          Criar Novo
        </Link>
      </header>

      {balancers.length === 0 ? (
        <div className={`glass ${styles.emptyState}`}>
          <p className="text-muted">Nenhum balanceador criado ainda.</p>
          <Link href="/admin/balancers/new" className="btn-primary" style={{ marginTop: '1rem' }}>
            Criar meu primeiro balanceador
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {balancers.map((balancer: any) => (
            <div key={balancer.id} className={`glass ${styles.card}`}>
              <div className={styles.cardHeader}>
                <h3>{balancer.name}</h3>
                <span className={styles.badge}>{balancer._count.accessLogs} cliques</span>
              </div>
              <div className={styles.slugRow}>
                <p className={styles.slugText}>/{balancer.slug}</p>
                <CopyButton slug={balancer.slug} />
              </div>
              
              <div className={styles.destinations}>
                <h4>Destinos ({balancer.destinations.length})</h4>
                <div className={styles.destList}>
                  {balancer.destinations.map((dest: any) => (
                    <div key={dest.id} className={styles.destItem}>
                      <span className={styles.destUrl} title={dest.url}>{dest.url}</span>
                      <span className={styles.destWeight}>{dest.weight}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.actions}>
                <Link href={`/admin/balancers/${balancer.id}/reports`} className={styles.actionBtn}>
                  Relatórios
                </Link>
                <Link href={`/admin/balancers/${balancer.id}/edit`} className={styles.actionBtn}>
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
