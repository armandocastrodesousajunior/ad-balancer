import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import styles from '../../reports.module.css'

export const dynamic = 'force-dynamic'

export default async function ReportsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const balancer = await prisma.balancer.findUnique({
    where: { id },
    include: {
      destinations: {
        include: {
          _count: {
            select: { accessLogs: true }
          }
        }
      },
      accessLogs: {
        orderBy: { createdAt: 'desc' },
        take: 50
      },
      _count: {
        select: { accessLogs: true }
      }
    }
  })

  if (!balancer) {
    notFound()
  }

  const totalClicks = balancer._count.accessLogs

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2>Relatório: {balancer.name}</h2>
          <p className="text-muted">Link: /{balancer.slug}</p>
        </div>
        <Link href="/admin/dashboard" className="btn-primary">Voltar</Link>
      </header>

      <div className={styles.statsGrid}>
        <div className={`glass ${styles.statCard}`}>
          <h3>Total de Cliques</h3>
          <span className={styles.statValue}>{totalClicks}</span>
        </div>
      </div>

      <div className={styles.distributionSection}>
        <h3>Distribuição de Tráfego</h3>
        <div className={styles.destList}>
          {balancer.destinations.map((dest: any) => {
            const clicks = dest._count.accessLogs
            const actualPercentage = totalClicks > 0 ? ((clicks / totalClicks) * 100).toFixed(1) : '0.0'
            const targetPercentage = dest.weight
            
            return (
              <div key={dest.id} className={`glass ${styles.destRow}`}>
                <div className={styles.destInfo}>
                  <span className={styles.destUrl}>{dest.url}</span>
                  <div className={styles.destMeta}>
                    <span>Alvo: {targetPercentage}%</span>
                    <span>Real: {actualPercentage}%</span>
                    <span>Cliques: {clicks}</span>
                  </div>
                </div>
                <div className={styles.progressBarContainer}>
                  <div 
                    className={styles.progressBar} 
                    style={{ width: `${actualPercentage}%` }}
                  ></div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.logsSection}>
        <h3>Últimos 50 Acessos</h3>
        {balancer.accessLogs.length === 0 ? (
          <p className="text-muted">Nenhum acesso registrado ainda.</p>
        ) : (
          <div className={`glass ${styles.tableContainer}`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>IP</th>
                  <th>Destino Sorteado</th>
                  <th>Origem (Referrer)</th>
                </tr>
              </thead>
              <tbody>
                {balancer.accessLogs.map((log: any) => {
                  const dest = balancer.destinations.find((d: any) => d.id === log.destinationId)
                  return (
                    <tr key={log.id}>
                      <td>{new Date(log.createdAt).toLocaleString('pt-BR')}</td>
                      <td>{log.ipAddress || 'Desconhecido'}</td>
                      <td title={dest?.url} className={styles.truncate}>{dest?.url || 'N/A'}</td>
                      <td className={styles.truncate} title={log.referrer || '-'}>{log.referrer || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
