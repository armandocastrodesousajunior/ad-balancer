import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function RedirectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Não interceptar rotas de sistema
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

  // Se não houver Pixel configurado, faça o redirecionamento imediato no lado do servidor (HTTP 302/307)
  if (!balancer.metaPixelId) {
    redirect(selectedDestination.url)
  }

  // Se houver Pixel configurado, retorna uma página HTML minúscula que carrega o Pixel e então redireciona via JavaScript
  const pixelId = balancer.metaPixelId
  const pixelEvent = balancer.metaPixelEvent || 'PageView'
  const destUrl = selectedDestination.url

  return (
    <html>
      <head>
        <title>Redirecionando...</title>
        <meta name="robots" content="noindex, nofollow" />
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
              
              // Fallback caso o evento demore muito, forçamos o redirecionamento após 800ms
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
      </head>
      <body style={{ backgroundColor: '#000', color: '#333', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', margin: 0, fontFamily: 'sans-serif' }}>
        {/* Um indicador de carregamento leve */}
        <div style={{ width: '24px', height: '24px', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style dangerouslySetInnerHTML={{__html: `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}} />
      </body>
    </html>
  )
}
