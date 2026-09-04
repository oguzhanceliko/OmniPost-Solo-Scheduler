import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getAllAccounts, createAccount, updateAccount, deleteAccount } from '@/lib/db';
import { Account } from '@/types';
import crypto from 'crypto';

export async function GET() {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    const accounts = await getAllAccounts();
    return NextResponse.json({ accounts });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Hesaplar getirilemedi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, platform, name, credentials, is_active } = body;

    if (!platform || !name) {
      return NextResponse.json(
        { error: 'Platform ve hesap adı zorunludur' },
        { status: 400 }
      );
    }

    if (id) {
      // Güncelleme
      const updated: Account = {
        id,
        platform,
        name,
        credentials: credentials || {},
        is_active: is_active ?? true,
        created_at: new Date().toISOString(),
      };
      await updateAccount(updated);
      return NextResponse.json({ success: true, account: updated });
    } else {
      // Yeni Hesap
      const newAccount: Account = {
        id: crypto.randomUUID(),
        platform,
        name,
        credentials: credentials || {},
        is_active: is_active ?? true,
        created_at: new Date().toISOString(),
      };
      await createAccount(newAccount);
      return NextResponse.json({ success: true, account: newAccount });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Hesap kaydedilemedi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID parametresi zorunludur' }, { status: 400 });
    }

    await deleteAccount(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Hesap silinemedi';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
