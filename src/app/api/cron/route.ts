import { NextRequest, NextResponse } from 'next/server';
import { getPendingDuePosts } from '@/lib/db';
import { processPostPublication } from '@/lib/publishers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Cron Güvenlik Kontrolü
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret) {
    const authHeader = req.headers.get('authorization');
    const urlSecret = req.nextUrl.searchParams.get('secret');

    const isMatch =
      authHeader === `Bearer ${expectedSecret}` || urlSecret === expectedSecret;

    if (!isMatch) {
      return NextResponse.json({ error: 'Geçersiz cron secret' }, { status: 401 });
    }
  }

  try {
    const nowIso = new Date().toISOString();
    const duePosts = await getPendingDuePosts(nowIso);

    console.log(`[Cron Trigger] ${nowIso} - Zamanı gelen ${duePosts.length} gönderi bulundu.`);

    const results = [];
    for (const post of duePosts) {
      console.log(`[Cron Trigger] İşleniyor: ${post.id} (${post.caption.slice(0, 30)}...)`);
      const res = await processPostPublication(post);
      results.push({ id: post.id, success: res.success, log: res.log });
    }

    return NextResponse.json({
      success: true,
      timestamp: nowIso,
      processed: duePosts.length,
      results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Cron görevi sırasında hata oluştu';
    console.error('[Cron Error]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
