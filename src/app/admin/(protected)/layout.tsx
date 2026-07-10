import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import styles from './layout.module.css'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.dashboardContainer}>
      <header className={`glass ${styles.header}`}>
        <div className={styles.logo}>
          <h1>Ad Balancer</h1>
        </div>
        <nav className={styles.nav}>
          <Link href="/admin/dashboard" className={styles.navLink}>Dashboard</Link>
          <form action={logout}>
            <button type="submit" className={styles.logoutBtn}>Sair</button>
          </form>
        </nav>
      </header>
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  )
}
