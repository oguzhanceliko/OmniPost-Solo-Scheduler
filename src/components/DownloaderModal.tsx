'use client';

import React, { useState, useEffect } from 'react';
import { YouTubeIcon, InstagramIcon, TikTokIcon } from './icons';
import {
  X,
  Download,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ClipboardPaste,
  ExternalLink,
} from 'lucide-react';

interface DownloaderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DownloaderModal({ isOpen, onClose }: DownloaderModalProps) {
  const [url, setUrl] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [resolvedVideo, setResolvedVideo] = useState<{
    downloadUrl: string;
    directAlternative?: string;
    backupAlternative?: string;
    pureUrl?: string;
    title: string;
    platform: string;
    thumbnail?: string;
    author?: string;
    isExternalDownload?: boolean;
  } | null>(null);

  // Modal her açıldığında veya kapandığında eski hata ve durumları sıfırla
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setResolvedVideo(null);
      setUrl('');
      setCopiedLink(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch {
      // Panodan okuma izni verilmediyse sessizce geç
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsResolving(true);
    setError(null);
    setResolvedVideo(null);

    try {
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      // Unexpected end of JSON input hatasını önlemek için güvenli okuma
      const text = await res.text();
      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error('Sunucudan geçersiz bir yanıt alındı.');
      }

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Video bağlantısı çözülemedi.');
      }

      setResolvedVideo(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bağlantı çözülemedi';
      setError(msg);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Başlık */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Download className="w-4 h-4 text-zinc-300" />
            <h3 className="text-sm font-semibold text-zinc-100">
              Orijinal Kalitede Video İndir
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal İçerik */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Desteklenen Platform Rozetleri */}
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Desteklenen Platformlar:</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-red-400 bg-red-950/30 px-2 py-0.5 rounded border border-red-900/40">
                <YouTubeIcon className="w-3 h-3" /> YouTube / Shorts
              </span>
              <span className="flex items-center gap-1 text-pink-400 bg-pink-950/30 px-2 py-0.5 rounded border border-pink-900/40">
                <InstagramIcon className="w-3 h-3" /> Reels
              </span>
              <span className="flex items-center gap-1 text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                <TikTokIcon className="w-3 h-3" /> TikTok
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleResolve} className="space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="YouTube, Reels veya TikTok linkini yapıştırın..."
                className="w-full pl-9 pr-24 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 transition"
              />
              <button
                type="button"
                onClick={handlePaste}
                className="absolute inset-y-1 right-1 px-2.5 flex items-center gap-1 text-[11px] font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              >
                <ClipboardPaste className="w-3 h-3" />
                <span>Yapıştır</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isResolving || !url.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition shadow-sm disabled:opacity-50"
            >
              {isResolving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Bağlantı Çözülüyor...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Bağlantıyı Çöz & İndir</span>
                </>
              )}
            </button>
          </form>

          {/* Hata Mesajı */}
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Çözülen Video Kartı */}
          {resolvedVideo && (
            <div className="p-4 rounded-xl border border-zinc-700/80 bg-zinc-900/70 space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Video Başarıyla Çözüldü</span>
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {resolvedVideo.platform}
                </span>
              </div>

              {/* Video Başlık ve Görsel */}
              <div className="flex gap-3 items-start">
                {resolvedVideo.thumbnail && (
                  <img
                    src={resolvedVideo.thumbnail}
                    alt="Kapak"
                    className="w-20 h-14 object-cover rounded-lg border border-zinc-800 shrink-0"
                  />
                )}
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="text-xs text-zinc-200 font-medium line-clamp-2 leading-snug">
                    {resolvedVideo.title}
                  </div>
                  {resolvedVideo.author && (
                    <div className="text-[11px] text-zinc-400 truncate">
                      Kanal: {resolvedVideo.author}
                    </div>
                  )}
                </div>
              </div>

              {/* İndirme Butonları */}
              <div className="space-y-2 pt-1">
                <div className="flex flex-col sm:flex-row gap-2">
                  <a
                    href={resolvedVideo.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                      if (resolvedVideo.platform === 'YOUTUBE' && resolvedVideo.pureUrl) {
                        try {
                          navigator.clipboard.writeText(resolvedVideo.pureUrl);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 4000);
                        } catch {}
                      }
                    }}
                    download={resolvedVideo.platform === 'TIKTOK'}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {resolvedVideo.platform === 'TIKTOK'
                        ? 'Filigransız Doğrudan MP4 İndir'
                        : resolvedVideo.platform === 'YOUTUBE'
                        ? 'SSYouTube (ssyt.rip) ile İndir (Önerilen)'
                        : 'Orijinal Kalitede İndir (.mp4)'}
                    </span>
                    <ExternalLink className="w-3 h-3 text-black/70" />
                  </a>

                  {resolvedVideo.directAlternative && (
                    <a
                      href={resolvedVideo.directAlternative}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1 py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
                    >
                      <span>
                        {resolvedVideo.platform === 'YOUTUBE' ? 'y2down.cc Alternatifi' : 'Alternatif İndirici'}
                      </span>
                      <ExternalLink className="w-3 h-3 text-zinc-400" />
                    </a>
                  )}
                </div>

                {copiedLink && (
                  <div className="text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded px-2.5 py-1.5 flex items-center gap-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Temiz video linki panoya kopyalandı! Açılan sayfada Yapıştır'a tıklayabilirsiniz.</span>
                  </div>
                )}

                {resolvedVideo.backupAlternative && (
                  <div className="flex items-center justify-end">
                    <a
                      href={resolvedVideo.backupAlternative}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-zinc-500 hover:text-zinc-300 underline flex items-center gap-1"
                    >
                      <span>Yedek servis: SaveFrom portalını aç</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-zinc-500 leading-normal">
                İndirme işlemi doğrudan platform CDN'i üzerinden cihazınıza aktarılır. Vercel sunucunuzda bant genişliği ve zaman aşımı oluşmaz.
              </p>
            </div>
          )}
        </div>

        {/* Modal Alt Kısım */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
