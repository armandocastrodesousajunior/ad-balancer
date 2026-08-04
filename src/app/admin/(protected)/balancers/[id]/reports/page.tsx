import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import styles from '../../reports.module.css'
import ReferrerChart from '@/components/ReferrerChart'

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

  // Agrupar e contar as origens de todo o histórico do balanceador
  const groupedReferrers = await prisma.accessLog.groupBy({
    by: ['referrer'],
    where: { balancerId: id },
    _count: { referrer: true }
  })

  // Format the referrer data
  const referrerData = groupedReferrers
    .map(g => {
      let refName = g.referrer || 'Acesso Direto / Desconhecido'
      // If it's a full URL, try to extract just the hostname to group nicely
      if (refName.startsWith('http')) {
        try {
          const url = new URL(refName)
          refName = url.hostname
        } catch {
          // ignore parsing error
        }
      }
      return {
        referrer: refName,
        count: g._count.referrer
      }
    })
    // Group identical hostnames together (since some could be http vs https)
    .reduce((acc, curr) => {
      const existing = acc.find(item => item.referrer === curr.referrer)
      if (existing) {
        existing.count += curr.count
      } else {
        acc.push(curr)
      }
      return acc
    }, [] as { referrer: string, count: number }[])
    .sort((a, b) => b.count - a.count)

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
        {/* We can add more stat cards here later if needed */}
      </div>

      <div className={styles.grid2Cols}>
        <div className={styles.distributionSection}>
          <h3>Distribuição de Tráfego</h3>
          <div className={styles.destList}>
            {balancer.destinations.map((dest: any) => {
              const clicks = dest._count.accessLogs
              const actualPercentage = totalClicks > 0 ? ((clicks / totalClicks) * 100).toFixed(1) : '0.0'
              const allWeights = balancer.destinations.reduce((sum: number, d: any) => sum + d.weight, 0)
              const targetPercentage = allWeights > 0 ? ((dest.weight / allWeights) * 100).toFixed(1) : '0.0'
              
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

        <div className={styles.originsSection}>
          <h3>Origem dos Leads</h3>
          <div className={`glass ${styles.chartContainer}`}>
            <ReferrerChart data={referrerData} />
            
            <div className={styles.originsList}>
              {referrerData.map((item, i) => (
                <div key={i} className={styles.originItem}>
                  <span className={styles.originName}>{item.referrer}</span>
                  <span className={styles.originCount}>{item.count} cliques</span>
                </div>
              ))}
            </div>
          </div>
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
