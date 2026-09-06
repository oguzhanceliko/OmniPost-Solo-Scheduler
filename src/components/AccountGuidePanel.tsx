'use client';

import React, { useState } from 'react';
import { Platform } from '@/types';
import { YouTubeIcon, InstagramIcon, TikTokIcon } from './icons';
import { ExternalLink, Copy, Check, BookOpen, AlertCircle, Sparkles } from 'lucide-react';

interface AccountGuidePanelProps {
  initialPlatform?: Platform;
  onClose?: () => void;
}

export function AccountGuidePanel({ initialPlatform = 'YOUTUBE' }: AccountGuidePanelProps) {
  const [activeTab, setActiveTab] = useState<Platform>(initialPlatform);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-zinc-900/90 border-l border-zinc-800 text-zinc-100 overflow-hidden">
      {/* Başlık ve Platform Sekmeleri */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/60 space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-zinc-100">API & Token Alma Rehberi</h4>
            <p className="text-[10px] text-zinc-400">Yeni hesap eklerken anahtarları nasıl alırsınız?</p>
          </div>
        </div>

        {/* Tab Seçiciler */}
        <div className="grid grid-cols-3 gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab('YOUTUBE')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'YOUTUBE'
                ? 'bg-red-950/60 border border-red-800/80 text-red-200 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <YouTubeIcon className="w-3.5 h-3.5" />
            <span>YouTube</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('INSTAGRAM')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'INSTAGRAM'
                ? 'bg-pink-950/60 border border-pink-800/80 text-pink-200 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <InstagramIcon className="w-3.5 h-3.5" />
            <span>Instagram</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TIKTOK')}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'TIKTOK'
                ? 'bg-zinc-800 border border-zinc-700 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <TikTokIcon className="w-3.5 h-3.5" />
            <span>TikTok</span>
          </button>
        </div>
      </div>

      {/* Rehber İçerikleri */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* ================= YOUTUBE REHBERİ ================= */}
        {activeTab === 'YOUTUBE' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/30 text-zinc-300 space-y-1">
              <span className="font-semibold text-red-400 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Hızlı Bilgi:
              </span>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                Google Cloud projeniz zaten hazır olduğu için yeni kanal eklemek <strong>sadece 1 dakika</strong> sürer.
                Client ID ve Client Secret tüm kanallarınız için ortaktır; yalnızca her kanalın <strong>Refresh Token</strong>&apos;ı farklıdır.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-[10px] font-bold">1</span>
                  Gmail&apos;i Test Kullanıcısı Ekle
                </div>
                <p className="text-[11px] text-zinc-400">
                  Google Cloud Console&apos;da yeni YouTube kanalının bağlı olduğu Gmail&apos;i ekleyin:
                </p>
                <a
                  href="https://console.cloud.google.com/apis/credentials/consent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium underline"
                >
                  <span>Google Cloud Consent &rarr; Audience</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <p className="text-[10px] text-zinc-500">
                  &ldquo;Audience&rdquo; sekmesinde <strong>&ldquo;+ Add Users&rdquo;</strong> deyip yeni Gmail&apos;i ekleyin ve kaydedin.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-[10px] font-bold">2</span>
                  Refresh Token Al (OAuth Playground)
                </div>
                <p className="text-[11px] text-zinc-400">
                  OAuth 2.0 Playground aracını açın:
                </p>
                <a
                  href="https://developers.google.com/oauthplayground"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-medium underline"
                >
                  <span>Google OAuth Playground</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <ol className="text-[11px] text-zinc-400 list-decimal list-inside space-y-1 pl-1">
                  <li>Sağ üstteki ⚙️ <strong>Dişli Çark</strong> simgesine tıklayın.</li>
                  <li><strong>&ldquo;Use your own OAuth credentials&rdquo;</strong> kutusunu işaretleyin (Client ID/Secret otomatik kayıtlıdır).</li>
                  <li>Sol listeden YouTube scope&apos;unu seçin:</li>
                </ol>
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-[10px] text-zinc-300">
                  <span className="truncate">https://www.googleapis.com/auth/youtube.upload</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('https://www.googleapis.com/auth/youtube.upload', 'scope')}
                    className="ml-2 p-1 text-zinc-400 hover:text-white"
                  >
                    {copiedText === 'scope' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <ol start={4} className="text-[11px] text-zinc-400 list-decimal list-inside space-y-1 pl-1">
                  <li><strong>&ldquo;Authorize APIs&rdquo;</strong> deyip yeni YouTube kanalınızın Gmail&apos;iyle giriş yapın.</li>
                  <li><strong>&ldquo;Exchange authorization code for tokens&rdquo;</strong> butonuna basıp sağdaki <strong>Refresh token</strong>&apos;ı kopyalayın!</li>
                </ol>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1.5">
                <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-[10px] font-bold">3</span>
                  Forma Yapıştır & Kaydet
                </div>
                <p className="text-[11px] text-zinc-400">
                  Yandaki formda Client ID ve Secret&apos;ı aynı bırakıp yeni <strong>Refresh Token</strong>&apos;ı yapıştırın ve &ldquo;Hesabı Kaydet&rdquo;e basın.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= INSTAGRAM REHBERİ ================= */}
        {activeTab === 'INSTAGRAM' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-pink-950/20 border border-pink-900/30 text-zinc-300 space-y-1">
              <span className="font-semibold text-pink-400 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Hızlı Bilgi:
              </span>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                Instagram Reels videoları Facebook Sayfası köprüsü üzerinden yayınlanır. App Review gerekmez, kendi hesabınıza anında ve herkese açık video yükleyebilirsiniz.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-[10px] font-bold">1</span>
                  Instagram&apos;ı Facebook Sayfasına Bağla
                </div>
                <ol className="text-[11px] text-zinc-400 list-decimal list-inside space-y-1 pl-1">
                  <li>Instagram mobil uygulamasında hesabınızı <strong>Profesyonel / İçerik Üretici</strong> hesaba geçirin.</li>
                  <li>Bir Facebook sayfası açın veya mevcut sayfanızı kullanın:</li>
                </ol>
                <a
                  href="https://www.facebook.com/pages/create"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 font-medium underline"
                >
                  <span>Facebook Sayfa Oluşturucu</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <p className="text-[11px] text-zinc-400">
                  Instagram telefonda <strong>Profili Düzenle &rarr; Sayfa</strong> kısmından Facebook sayfanızı bağlayın.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-[10px] font-bold">2</span>
                  Token ve ID&apos;yi Al (Graph Explorer)
                </div>
                <p className="text-[11px] text-zinc-400">
                  Meta Graph API Explorer aracını açın:
                </p>
                <a
                  href="https://developers.facebook.com/tools/explorer/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 font-medium underline"
                >
                  <span>Meta Graph API Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <ol className="text-[11px] text-zinc-400 list-decimal list-inside space-y-1 pl-1">
                  <li>Mavi <strong>&ldquo;Generate Access Token&rdquo;</strong> butonuna tıklayın.</li>
                  <li>Yeni sayfanızı ve Instagram hesabınızı onaylayın.</li>
                  <li>Üstteki sorgu çubuğuna şunu yazıp <strong>Submit</strong> deyin:</li>
                </ol>
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-[10px] text-zinc-300">
                  <span className="truncate">me/accounts?fields=name,access_token,instagram_business_account&#123;id,username&#125;</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('me/accounts?fields=name,access_token,instagram_business_account{id,username}', 'ig_query')}
                    className="ml-2 p-1 text-zinc-400 hover:text-white"
                  >
                    {copiedText === 'ig_query' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500">
                  Dönen yanıttaki <code>instagram_business_account.id</code> = <strong>Account ID</strong>,<br />
                  <code>access_token</code> = <strong>Access Token</strong>&apos;dır.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1.5">
                <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-[10px] font-bold">3</span>
                  Forma Yapıştır & Kaydet
                </div>
                <p className="text-[11px] text-zinc-400">
                  Yandaki formda Platform olarak Instagram seçip aldığınız Account ID ve Token&apos;ı yapıştırın!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= TIKTOK REHBERİ ================= */}
        {activeTab === 'TIKTOK' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-300 space-y-1">
              <span className="font-semibold text-zinc-200 text-xs flex items-center gap-1.5">
                <TikTokIcon className="w-3.5 h-3.5" /> Tek Tıkla Bağlantı:
              </span>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                TikTok hesabınızı bağlamak için formdaki <strong>&ldquo;TikTok ile Hesabı Bağla&rdquo;</strong> butonuna basarak doğrudan giriş yapabilirsiniz.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/30 space-y-2">
              <div className="font-semibold text-amber-400 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Herkese Açık Yayın (App Review)
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-400">
                Geliştirici modundaki uygulamalar TikTok kuralları gereği videoları <strong>&ldquo;Sadece Ben / Gizli&rdquo;</strong> olarak paylaşır.
                Videonun herkese açık yayınlanması için TikTok Developer Portal&apos;daki App Review başvurusunun onaylanması beklenmelidir.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
