import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse('tiktok-developers-site-verification=6k7HpUSaQ3rTtZfCXLGI2vsnVbPgDkMs', {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
