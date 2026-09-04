import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const filePathArray = resolvedParams.path || [];
  const filename = path.basename(filePathArray.join('/'));

  const uploadsDir = process.env.VERCEL
    ? path.join('/tmp', 'local_uploads')
    : path.join(process.cwd(), 'local_uploads');

  const localFile = path.join(uploadsDir, filename);

  if (!fs.existsSync(localFile)) {
    return new NextResponse('Dosya bulunamadı', { status: 404 });
  }

  const stat = fs.statSync(localFile);
  const fileSize = stat.size;
  const range = req.headers.get('range');

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const fileStream = fs.createReadStream(localFile, { start, end });

    // Stream the video slice
    const readable = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(chunk));
        fileStream.on('end', () => controller.close());
        fileStream.on('error', (err) => controller.error(err));
      },
    });

    return new NextResponse(readable, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type': 'video/mp4',
      },
    });
  }

  const fileStream = fs.createReadStream(localFile);
  const readable = new ReadableStream({
    start(controller) {
      fileStream.on('data', (chunk) => controller.enqueue(chunk));
      fileStream.on('end', () => controller.close());
      fileStream.on('error', (err) => controller.error(err));
    },
  });

  return new NextResponse(readable, {
    headers: {
      'Content-Length': String(fileSize),
      'Content-Type': 'video/mp4',
    },
  });
}
