import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_PASSWORD, SESSION_COOKIE_NAME, getExpectedToken, verifyAuth } from '@/lib/auth';

export async function GET() {
  const authenticated = await verifyAuth();
  return NextResponse.json({ authenticated });
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (password === ADMIN_PASSWORD) {
      const response = NextResponse.json({ success: true });
      response.cookies.set(SESSION_COOKIE_NAME, getExpectedToken(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 gün
      });
      return response;
    }

    return NextResponse.json({ success: false, error: 'Geçersiz şifre' }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, error: 'Giriş işlemi başarısız' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
