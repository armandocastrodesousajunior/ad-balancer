import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  // Não interceptar rotas de sistema
  if (
    slug === 'admin' || 
    slug.startsWith('_next') || 
    slug === 'favicon.ico' || 
    slug.includes('.')
  ) {
    return NextResponse.next()
  }

  const balancer = await prisma.balancer.findUnique({
    where: { slug },
    include: { destinations: true }
  })

  if (!balancer || balancer.destinations.length === 0) {
    return new NextResponse('Link não encontrado ou sem destinos configurados.', { status: 404 })
  }

  // Lógica de seleção ponderada (weighted random)
  const randomNum = Math.random() * 100
  let runningSum = 0
  let selectedDestination = balancer.destinations[balancer.destinations.length - 1] // Fallback

  for (const dest of balancer.destinations) {
    runningSum += dest.weight
    if (randomNum <= runningSum) {
      selectedDestination = dest
      break
    }
  }

  // Capturar dados para o log
  const ipAddress = request.headers.get('x-forwarded-for') || null
  const userAgent = request.headers.get('user-agent') || null
  const referrer = request.headers.get('referer') || null

  // Registrar o log assincronamente (não travamos o redirect)
  // Como estamos no ambiente Node (padrão do Next.js App Router), 
  // promessas não 'awaitadas' são executadas até o fim no ciclo de eventos.
  prisma.accessLog.create({
    data: {
      balancerId: balancer.id,
      destinationId: selectedDestination.id,
      ipAddress: ipAddress ? ipAddress.split(',')[0] : null,
      userAgent,
      referrer
    }
  }).catch((err: unknown) => console.error('Erro ao salvar log:', err))

  // Redirecionar para o destino selecionado (HTTP 302 temporário para não cachear o redirect no browser)
  return NextResponse.redirect(selectedDestination.url, 302)
}
