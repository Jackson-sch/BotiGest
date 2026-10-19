'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authenticateWithDniAndPin, signSession, AUTH_COOKIE_NAME } from '@/lib/auth';

/**
 * Server Action: Iniciar Sesión Farmacéutica
 */
export async function loginAction(prevState: any, formData: FormData) {
  const dni = formData.get('dni') as string;
  const pin = formData.get('pin') as string;

  const result = await authenticateWithDniAndPin(dni, pin);

  if (!result.success || !result.user) {
    return {
      success: false,
      error: result.error || 'Credenciales inválidas.',
    };
  }

  const token = await signSession(result.user);
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 días de validez
  });

  redirect('/');
}

/**
 * Server Action: Cerrar Sesión Farmacéutica
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect('/login');
}
