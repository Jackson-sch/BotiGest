'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authenticateWithDniAndPin, signSession, AUTH_COOKIE_NAME } from '@/lib/auth';

/**
 * Server Action: Iniciar Sesión Farmacéutica
 * Soporta tanto formularios nativos (action={loginAction}) como useActionState
 */
export async function loginAction(prevState: any, formData?: FormData) {
  const data = formData instanceof FormData ? formData : (prevState instanceof FormData ? prevState : new FormData());
  const dni = (data.get('dni') as string)?.trim() || '';
  const pin = (data.get('pin') as string)?.trim() || '';

  const result = await authenticateWithDniAndPin(dni, pin);

  if (!result.success || !result.user) {
    return {
      success: false,
      error: result.error || 'Credenciales inválidas.',
    };
  }

  const token = await signSession(result.user);
  const cookieStore = await cookies();
  const headersList = await headers();
  const proto = headersList.get('x-forwarded-proto') || '';
  const origin = headersList.get('origin') || '';
  const referer = headersList.get('referer') || '';
  const isHttps =
    proto === 'https' ||
    origin.startsWith('https:') ||
    referer.startsWith('https:') ||
    process.env.NODE_ENV === 'production';

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 días de validez
  });

  redirect('/');
}

/**
 * Server Action: Acceso directo 1-clic para botones demo
 */
export async function loginDirectAction(formData: FormData): Promise<void> {
  await loginAction(null, formData);
}

/**
 * Server Action: Cerrar Sesión Farmacéutica
 */
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  redirect('/login');
}
