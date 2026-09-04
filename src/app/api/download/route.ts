import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    const url = body?.url;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Lütfen geçerli bir video linki yapıştırın' }, { status: 400 });
    }

    const cleanUrl = url.trim();

    // ==================== 1. TIKTOK ====================
    if (cleanUrl.includes('tiktok.com')) {
      try {
        const tikRes = await fetch(
          `https://www.tikwm.com/api/?url=${encodeURIComponent(cleanUrl)}`,
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        const tikData = await tikRes.json().catch(() => null);
        if (tikData?.data?.play) {
          return NextResponse.json({
            success: true,
            platform: 'TIKTOK',
            title: tikData.data.title || 'TikTok Video',
            downloadUrl: tikData.data.play, // Filigransız doğrudan CDN mp4 linki
            thumbnail: tikData.data.cover,
            duration: tikData.data.duration,
          });
        }
      } catch (e) {
        console.warn('TikWM error:', e);
      }
    }

    // ==================== 2. YOUTUBE SHORTS & NORMAL ====================
    if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
      try {
        // YouTube Resmi oEmbed ile video başlık ve kapak bilgisini çek (Asla IP engeline takılmaz)
        const oembedRes = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json`
        );
        const oembedData = oembedRes.ok ? await oembedRes.json().catch(() => null) : null;
        const videoTitle = oembedData?.title || 'YouTube Video';
        const thumbnail = oembedData?.thumbnail_url || undefined;
        const author = oembedData?.author_name || undefined;

        // Video ID tespit et
        let videoId = '';
        if (cleanUrl.includes('shorts/')) {
          videoId = cleanUrl.split('shorts/')[1]?.split('?')[0]?.split('/')[0] || '';
        } else if (cleanUrl.includes('watch?v=')) {
          videoId = cleanUrl.split('watch?v=')[1]?.split('&')[0] || '';
        } else if (cleanUrl.includes('youtu.be/')) {
          videoId = cleanUrl.split('youtu.be/')[1]?.split('?')[0] || '';
        }

        // Hızlı ve güvenilir indirme portalları oluştur (Reklamsız ve doğrudan indirme)
        const downloadUrl = `https://10downloader.com/download?v=${encodeURIComponent(cleanUrl)}`;
        const directAlternative = videoId ? `https://y2down.cc/en/?url=${encodeURIComponent(cleanUrl)}` : undefined;

        return NextResponse.json({
          success: true,
          platform: 'YOUTUBE',
          title: videoTitle,
          thumbnail,
          author,
          downloadUrl,
          directAlternative,
          isExternalDownload: true,
        });
      } catch (e) {
        console.warn('YouTube oEmbed error:', e);
      }
    }

    // ==================== 3. INSTAGRAM REELS ====================
    if (cleanUrl.includes('instagram.com')) {
      return NextResponse.json({
        success: true,
        platform: 'INSTAGRAM',
        title: 'Instagram Reels Video',
        downloadUrl: `https://snapinsta.app/?url=${encodeURIComponent(cleanUrl)}`,
        directAlternative: `https://saveig.app/?url=${encodeURIComponent(cleanUrl)}`,
        isExternalDownload: true,
      });
    }

    return NextResponse.json(
      {
        error:
          'Desteklenmeyen veya geçersiz link. Lütfen geçerli bir YouTube, Instagram Reels veya TikTok linki girin.',
      },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'İndirme çözümü sırasında hata oluştu';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
