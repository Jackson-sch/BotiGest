import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, verifySession, isRouteAllowed } from '@/lib/permissions';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  const isLoginPage = pathname === '/login';
  const isSinAccesoPage = pathname === '/sin-acceso';

  // 1. Si no hay token de sesión
  if (!sessionToken) {
    if (isLoginPage) {
      return NextResponse.next();
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Si hay token de sesión, verificar validez y extraer rol
  const user = await verifySession(sessionToken);

  // Si el token es inválido o expiró, limpiar y mandar a login
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  // Si el usuario ya está autenticado e intenta ir a /login, redirigir al inicio
  if (isLoginPage) {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  // La página de información de acceso restringido es pública para logueados
  if (isSinAccesoPage) {
    return NextResponse.next();
  }

  // 3. Verificación de permisos por rol (RBAC Sanitario)
  const allowed = isRouteAllowed(pathname, user.rol);
  if (!allowed) {
    const sinAccesoUrl = new URL('/sin-acceso', request.url);
    sinAccesoUrl.searchParams.set('ruta', pathname);
    return NextResponse.redirect(sinAccesoUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
