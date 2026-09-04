import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getPostById } from '@/lib/db';
import { processPostPublication } from '@/lib/publishers';

export async function POST(req: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'ID gereklidir' }, { status: 400 });
    }

    const post = await getPostById(id);
    if (!post) {
      return NextResponse.json({ error: 'Gönderi bulunamadı' }, { status: 404 });
    }

    // Doğrudan yayınlama işlemini başlat
    const result = await processPostPublication(post);
    return NextResponse.json({ success: result.success, log: result.log });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Yayınlama başarısız oldu';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
