import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { createUploadUrl, isR2Configured } from '@/lib/r2';

export async function POST(req: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    const { filename, contentType } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'Filename ve contentType gereklidir' },
        { status: 400 }
      );
    }

    const uploadInfo = await createUploadUrl(filename, contentType);

    return NextResponse.json({
      ...uploadInfo,
      isR2Configured,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Yükleme URL oluşturulamadı';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
