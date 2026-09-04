import { NextRequest, NextResponse } from 'next/server';
import { createAccount } from '@/lib/db';
import crypto from 'crypto';

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || 'awmjlpck32jcq70n';
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || '7rvudXsffQ1yWgvd54KZyWnwN55EklqP';
const REDIRECT_URI = 'https://omnipost-eosin.vercel.app/api/auth/tiktok/callback';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const state = searchParams.get('state');

  const isSandbox = state === 'sandbox';
  const effectiveKey = isSandbox ? 'sbawe4fhm9id9cbpwj' : (process.env.TIKTOK_CLIENT_KEY || 'awmjlpck32jcq70n');
  const effectiveSecret = isSandbox ? 't2SureQiAqCJhcDErDNnt8k95SEcYATl' : (process.env.TIKTOK_CLIENT_SECRET || '7rvudXsffQ1yWgvd54KZyWnwN55EklqP');

  if (error) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="utf-8">
        <title>TikTok Yetkilendirme Hatası</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { background: #09090b; color: #f4f4f5; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; max-width: 480px; width: 100%; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
          h2 { color: #f87171; margin-top: 0; font-size: 20px; }
          p { color: #a1a1aa; font-size: 14px; line-height: 1.5; }
          .btn { display: inline-block; background: #27272a; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 500; margin-top: 20px; border: 1px solid #3f3f46; }
          .btn:hover { background: #3f3f46; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>⚠️ Yetkilendirme Hatası</h2>
          <p>TikTok üzerinden onay alınamadı: <strong>${error}</strong></p>
          <p>${errorDescription || 'İşlem kullanıcı tarafından iptal edilmiş veya izin verilmemiş olabilir.'}</p>
          <a href="/" class="btn">← Panele Dön</a>
        </div>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  if (code) {
    let tokenData: any = null;
    let exchangeError = '';

    try {
      const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache',
        },
        body: new URLSearchParams({
          client_key: effectiveKey,
          client_secret: effectiveSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
        }),
      });

      tokenData = await tokenRes.json();

      const accessToken = tokenData?.access_token || tokenData?.data?.access_token;
      const refreshToken = tokenData?.refresh_token || tokenData?.data?.refresh_token || '';
      const openId = tokenData?.open_id || tokenData?.data?.open_id || '';

      if (accessToken) {
        try {
          await createAccount({
            id: crypto.randomUUID(),
            platform: 'TIKTOK',
            name: `@z1futbolresmi (TikTok)`,
            credentials: {
              tiktokAccessToken: accessToken,
              refreshToken: refreshToken,
              openId: openId,
            },
            is_active: true,
            created_at: new Date().toISOString(),
          });
        } catch (dbErr) {
          console.error('[DB save error]', dbErr);
        }
      } else if (tokenData?.error?.message || tokenData?.message) {
        exchangeError = tokenData.error?.message || tokenData.message;
      }
    } catch (err: any) {
      exchangeError = err?.message || 'Token isteği sırasında sunucu hatası';
    }

    const accessToken = tokenData?.access_token || tokenData?.data?.access_token;

    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="utf-8">
        <title>TikTok Bağlantısı</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { background: #09090b; color: #f4f4f5; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; max-width: 520px; width: 100%; padding: 32px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
          h2 { color: #34d399; margin-top: 0; font-size: 22px; display: flex; align-items: center; gap: 8px; }
          p { color: #a1a1aa; font-size: 14px; line-height: 1.6; }
          .token-box { background: #09090b; border: 1px solid #27272a; padding: 12px 14px; border-radius: 10px; font-family: monospace; font-size: 12px; color: #e4e4e7; word-break: break-all; margin: 16px 0; user-select: all; }
          .btn-group { display: flex; gap: 10px; margin-top: 24px; }
          .btn { display: inline-block; background: #fff; color: #09090b; font-weight: 600; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-size: 13px; transition: all 0.2s; border: none; cursor: pointer; }
          .btn:hover { background: #e4e4e7; }
          .btn-secondary { background: #27272a; color: #fff; border: 1px solid #3f3f46; }
          .btn-secondary:hover { background: #3f3f46; }
          .badge { background: #064e3b; color: #6ee7b7; border: 1px solid #047857; font-size: 11px; padding: 3px 8px; border-radius: 999px; font-weight: 500; display: inline-block; margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          ${
            accessToken
              ? `
            <div class="badge">✓ Başarıyla Bağlandı</div>
            <h2>🎉 TikTok Hesabınız Eklendi!</h2>
            <p>TikTok hesabınız OmniPost paneline başarıyla kaydedildi. Artık panelden doğrudan bu hesabı seçerek video zamanlayabilir ve paylaşabilirsiniz.</p>
            
            <p style="margin-top:16px;font-size:12px;color:#71717a;">TikTok Access Token'ınız (Güvenle saklandı):</p>
            <div class="token-box" id="tokenBox">${accessToken}</div>

            <div class="btn-group">
              <a href="/" class="btn">Panele Git & Video Paylaş →</a>
              <button onclick="navigator.clipboard.writeText(document.getElementById('tokenBox').innerText); alert('Token kopyalandı!');" class="btn btn-secondary">Kopyala</button>
            </div>
          `
              : `
            <h2 style="color:#fbbf24;">Yetkilendirme Kodu Alındı</h2>
            <p>TikTok'tan yetki kodu geldi ancak token alma sırasında şu hata oluştu:</p>
            <p style="color:#f87171;font-family:monospace;font-size:12px;">${exchangeError || 'Bilinmeyen hata'}</p>
            <p>Gelen Authorization Code:</p>
            <div class="token-box">${code}</div>
            <div class="btn-group">
              <a href="/" class="btn btn-secondary">← Panele Dön</a>
            </div>
          `
          }
        </div>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  return new NextResponse(
    `<!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="utf-8">
      <title>TikTok Callback</title>
      <style>
        body { background: #09090b; color: #f4f4f5; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 32px; text-align: center; max-width: 400px; }
        a { color: #60a5fa; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="card">
        <h3>OmniPost TikTok Servisi</h3>
        <p style="color:#a1a1aa;font-size:14px;">Bu adres TikTok OAuth geri dönüş adresidir.</p>
        <a href="/">← Panele Dön</a>
      </div>
    </body>
    </html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}
