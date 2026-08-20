import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params

  if (slug === 'admin' || slug.startsWith('_next') || slug === 'favicon.ico') {
    return {}
  }

  const balancer = await prisma.balancer.findUnique({
    where: { slug }
  })

  if (!balancer) return {}

  return {
    title: balancer.metaTitle || 'Redirecionando...',
    description: balancer.metaDescription || '',
    openGraph: {
      title: balancer.metaTitle || 'Redirecionando...',
      description: balancer.metaDescription || '',
      type: 'website'
    },
    robots: {
      index: false,
      follow: false
    }
  }
}

export default async function RedirectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  if (
    slug === 'admin' || 
    slug.startsWith('_next') || 
    slug === 'favicon.ico' || 
    slug.includes('.')
  ) {
    notFound()
  }

  const balancer = await prisma.balancer.findUnique({
    where: { slug },
    include: { destinations: true }
  })

  if (!balancer || balancer.destinations.length === 0) {
    notFound()
  }

  // Lógica de seleção ponderada (weighted random com pesos relativos)
  const totalWeight = balancer.destinations.reduce((sum, d) => sum + d.weight, 0)
  const randomNum = Math.random() * totalWeight
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
  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for') || null
  const userAgent = headersList.get('user-agent') || null
  const referrer = headersList.get('referer') || null

  // Registrar o log assincronamente
  prisma.accessLog.create({
    data: {
      balancerId: balancer.id,
      destinationId: selectedDestination.id,
      ipAddress: ipAddress ? ipAddress.split(',')[0] : null,
      userAgent,
      referrer
    }
  }).catch((err: unknown) => console.error('Erro ao salvar log:', err))

  const destUrl = selectedDestination.url
  const hasPixel = !!balancer.metaPixelId
  const hasMeta = !!balancer.metaTitle || !!balancer.metaDescription
  
  // Se não houver Pixel configurado e não houver Metadados (que exigem leitura de bots), faz o redirect server-side
  if (!hasPixel && !hasMeta) {
    redirect(destUrl)
  }

  const pixelId = balancer.metaPixelId
  const pixelEvent = balancer.metaPixelEvent || 'PageView'

  return (
    <div style={{ backgroundColor: '#000', color: '#333', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', margin: 0 }}>
      {hasPixel && (
        <>
          <script
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${pixelId}');
                fbq('track', '${pixelEvent}');
                
                var redirected = false;
                var doRedirect = function() {
                  if(!redirected) {
                    redirected = true;
                    window.location.replace('${destUrl}');
                  }
                };
                setTimeout(doRedirect, 800);
              `
            }}
          />
          <noscript>
            <img 
              height="1" 
              width="1" 
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${pixelId}&ev=${pixelEvent}&noscript=1`}
            />
            <meta httpEquiv="refresh" content={`1;url=${destUrl}`} />
          </noscript>
        </>
      )}

      {/* Se não tem pixel mas tem meta, fazemos o redirecionamento imediato via JS/Meta refresh para os bots lerem a página */}
      {!hasPixel && hasMeta && (
        <>
          <script
            dangerouslySetInnerHTML={{
              __html: `window.location.replace('${destUrl}');`
            }}
          />
          <noscript>
            <meta httpEquiv="refresh" content={`0;url=${destUrl}`} />
          </noscript>
        </>
      )}

      {/* Indicador de carregamento */}
      <div style={{ width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}} />
    </div>
  )
}
