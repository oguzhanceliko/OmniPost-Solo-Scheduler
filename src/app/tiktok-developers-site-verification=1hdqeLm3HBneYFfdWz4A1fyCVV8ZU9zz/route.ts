import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse('tiktok-developers-site-verification=1hdqeLm3HBneYFfdWz4A1fyCVV8ZU9zz', {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
