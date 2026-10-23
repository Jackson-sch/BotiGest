import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
  const cleanHost = host.startsWith('0.0.0.0') ? 'localhost:3000' : host;
  const proto = request.headers.get('x-forwarded-proto') || (request.url.startsWith('https') ? 'https' : 'http');
  return NextResponse.redirect(new URL('/login', `${proto}://${cleanHost}`));
}
