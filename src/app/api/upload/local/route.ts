import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    if (!key) {
      return NextResponse.json({ error: 'Key parametresi eksik' }, { status: 400 });
    }

    const uploadsDir = process.env.VERCEL
      ? path.join('/tmp', 'local_uploads')
      : path.join(process.cwd(), 'local_uploads');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = path.basename(key);
    const filePath = path.join(uploadsDir, filename);

    const buffer = Buffer.from(await req.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ success: true, localPath: filePath });
  } catch (error) {
    console.error('Local upload error:', error);
    return NextResponse.json({ error: 'Yerel dosya kaydedilemedi' }, { status: 500 });
  }
}
