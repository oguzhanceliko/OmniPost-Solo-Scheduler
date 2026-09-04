import { NextRequest, NextResponse } from 'next/server';
import { login, logout, verifyAuth } from '@/lib/auth';

export async function GET() {
  const authenticated = await verifyAuth();
  return NextResponse.json({ authenticated });
}

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    const success = await login(password);

    if (success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: 'Geçersiz şifre' }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, error: 'Giriş işlemi başarısız' }, { status: 500 });
  }
}

export async function DELETE() {
  await logout();
  return NextResponse.json({ success: true });
}
