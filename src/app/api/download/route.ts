import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Geçerli bir URL giriniz' }, { status: 400 });
    }

    const cleanUrl = url.trim();

    // 1. TikTok için hızlı direkt filigransız CDN çözücü
    if (cleanUrl.includes('tiktok.com')) {
      try {
        const tikRes = await fetch(
          `https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`,
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        const tikData = await tikRes.json();
        if (tikData && tikData.data && tikData.data.play) {
          return NextResponse.json({
            success: true,
            platform: 'TIKTOK',
            title: tikData.data.title || 'TikTok Video',
            downloadUrl: tikData.data.play, // Filigransız orijinal video linki
            thumbnail: tikData.data.cover,
            duration: tikData.data.duration,
          });
        }
      } catch (e) {
        console.warn('TikWM fallback trigger:', e);
      }
    }

    // 2. YouTube Shorts / Normal & Instagram Reels için Cobalt Açık Kaynak Çözücü
    const cobaltInstances = [
      'https://api.cobalt.tools/api/json',
      'https://cobalt-api.kwiatekm.tokyo/api/json',
      'https://co.wuk.sh/api/json',
    ];

    for (const instance of cobaltInstances) {
      try {
        const res = await fetch(instance, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: cleanUrl,
            vQuality: 'max',
            filenamePattern: 'basic',
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const downloadUrl = data.url || data.picker?.[0]?.url;

          if (downloadUrl) {
            let platform = 'OTHER';
            if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) platform = 'YOUTUBE';
            if (cleanUrl.includes('instagram.com')) platform = 'INSTAGRAM';
            if (cleanUrl.includes('tiktok.com')) platform = 'TIKTOK';

            return NextResponse.json({
              success: true,
              platform,
              title: data.filename || `${platform.toLowerCase()}_video.mp4`,
              downloadUrl,
            });
          }
        }
      } catch (err) {
        console.warn(`Cobalt instance ${instance} failed, trying next...`, err);
      }
    }

    return NextResponse.json(
      {
        error:
          'Video bağlantısı çözülemedi. Lütfen linkin herkese açık (public) olduğunu kontrol edin.',
      },
      { status: 422 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'İndirme çözümü sırasında hata oluştu';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
