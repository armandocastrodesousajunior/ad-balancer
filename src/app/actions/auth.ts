'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const token = formData.get('token') as string
  const validToken = process.env.ADMIN_TOKEN

  if (token === validToken) {
    const cookieStore = await cookies()
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    })
    
    redirect('/admin/dashboard')
  } else {
    return { error: 'Token inválido' }
  }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_token')
  redirect('/admin')
}
