'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

interface DestinationInput {
  url: string
  weight: number
}

interface BalancerInput {
  name: string
  slug: string
  destinations: DestinationInput[]
  metaPixelId?: string | null
  metaPixelEvent?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
}

export async function createBalancer(data: BalancerInput) {
  try {
    // Check if slug exists
    const existing = await prisma.balancer.findUnique({
      where: { slug: data.slug }
    })
    
    if (existing) {
      return { error: 'Este link (slug) já está em uso.' }
    }

    await prisma.balancer.create({
      data: {
        name: data.name,
        slug: data.slug,
        metaPixelId: data.metaPixelId || null,
        metaPixelEvent: data.metaPixelEvent || 'PageView',
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        destinations: {
          create: data.destinations.map(d => ({
            url: d.url,
            weight: d.weight
          }))
        }
      }
    })

    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Ocorreu um erro ao salvar o balanceador.' }
  }
}

export async function updateBalancer(id: string, data: BalancerInput) {
  try {
    // Se o slug for alterado, verificar se já não existe outro com esse slug
    const existing = await prisma.balancer.findUnique({
      where: { slug: data.slug }
    })

    if (existing && existing.id !== id) {
      return { error: 'Este link (slug) já está em uso por outro balanceador.' }
    }

    // Para simplificar, apagamos as destinations antigas e criamos as novas.
    await prisma.destination.deleteMany({
      where: { balancerId: id }
    })

    await prisma.balancer.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        metaPixelId: data.metaPixelId || null,
        metaPixelEvent: data.metaPixelEvent || 'PageView',
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        destinations: {
          create: data.destinations.map(d => ({
            url: d.url,
            weight: d.weight
          }))
        }
      }
    })

    revalidatePath('/admin/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Erro ao atualizar balanceador:', error)
    return { error: 'Falha ao atualizar balanceador.' }
  }
}
