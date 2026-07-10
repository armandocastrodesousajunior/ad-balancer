import { redirect } from 'next/navigation'

export default function Home() {
  // Redireciona a home para o painel de administração
  redirect('/admin')
}
