import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:2rem;background:#18181b;color:#fff;">
        <h2>TikTok Yetkilendirme Hatası</h2>
        <p>${error}: ${errorDescription || 'Bilinmeyen hata'}</p>
        <a href="/" style="color:#60a5fa;">Panele Dön</a>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  if (code) {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:2rem;background:#18181b;color:#fff;">
        <h2>TikTok Yetkilendirme Başarılı! 🎉</h2>
        <p>Yetkilendirme Kodu (Code):</p>
        <code style="background:#27272a;padding:8px 12px;border-radius:6px;display:block;margin:10px 0;word-break:break-all;">${code}</code>
        <p style="margin-top:1.5rem;"><a href="/" style="color:#60a5fa;text-decoration:none;background:#27272a;padding:8px 16px;border-radius:6px;">← Panele Dön</a></p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  return new NextResponse(
    `<html><body style="font-family:sans-serif;padding:2rem;background:#18181b;color:#fff;">
      <h2>TikTok Callback</h2>
      <p>Bu adres TikTok Login Kit yönlendirme (Redirect URI) adresidir.</p>
      <a href="/" style="color:#60a5fa;">Panele Dön</a>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
