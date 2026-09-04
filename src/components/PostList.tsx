'use client';

import React, { useState } from 'react';
import { ScheduledPost, PostStatus } from '@/types';
import { LogModal } from './LogModal';
import {
  Calendar,
  Clock,
  Trash2,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Terminal,
  RefreshCw,
} from 'lucide-react';
import { YouTubeIcon, InstagramIcon, TikTokIcon } from './icons';

interface PostListProps {
  posts: ScheduledPost[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function PostList({ posts, isLoading, onRefresh }: PostListProps) {
  const [activeTab, setActiveTab] = useState<'ALL' | PostStatus>('ALL');
  const [activeLogPost, setActiveLogPost] = useState<ScheduledPost | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const filteredPosts = posts.filter((p) => {
    if (activeTab === 'ALL') return true;
    return p.status === activeTab;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Bu gönderiyi ve zamanlamayı silmek istediğinizden emin misiniz?')) return;

    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/posts?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onRefresh();
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePublishNow = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch('/api/posts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      onRefresh();
      if (!res.ok) {
        alert(`Yayınlama hatası: ${data.error || 'Bilinmeyen hata'}`);
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatScheduleDate = (isoStr: string) => {
    try {
      const date = new Date(isoStr);
      return date.toLocaleString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const counts = {
    ALL: posts.length,
    PENDING: posts.filter((p) => p.status === 'PENDING').length,
    PROCESSING: posts.filter((p) => p.status === 'PROCESSING').length,
    DONE: posts.filter((p) => p.status === 'DONE').length,
    FAILED: posts.filter((p) => p.status === 'FAILED').length,
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
            Gönderi Akışı & Durumlar
          </h2>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Listeyi Yenile"
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Minimalist Tabs */}
        <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800 text-xs">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-2.5 py-1 rounded-md transition font-medium ${
              activeTab === 'ALL'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Tümü ({counts.ALL})
          </button>
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`px-2.5 py-1 rounded-md transition font-medium ${
              activeTab === 'PENDING'
                ? 'bg-zinc-800 text-amber-400'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Bekleyen ({counts.PENDING})
          </button>
          <button
            onClick={() => setActiveTab('DONE')}
            className={`px-2.5 py-1 rounded-md transition font-medium ${
              activeTab === 'DONE'
                ? 'bg-zinc-800 text-emerald-400'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Tamamlanan ({counts.DONE})
          </button>
          <button
            onClick={() => setActiveTab('FAILED')}
            className={`px-2.5 py-1 rounded-md transition font-medium ${
              activeTab === 'FAILED'
                ? 'bg-zinc-800 text-red-400'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Hatalı ({counts.FAILED})
          </button>
        </div>
      </div>

      {/* Post Cards List */}
      {filteredPosts.length === 0 ? (
        <div className="py-12 border border-dashed border-zinc-800/80 rounded-2xl text-center space-y-2 bg-zinc-950/20">
          <Calendar className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-sm font-medium text-zinc-400">Bu sekmede gösterilecek gönderi yok</p>
          <p className="text-xs text-zinc-600">Yeni bir video yükleyip yukarıdaki formdan planlayabilirsiniz.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const isProcessing = actionLoadingId === post.id || post.status === 'PROCESSING';

            return (
              <div
                key={post.id}
                className="group p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/70 transition flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
              >
                {/* Sol: Video Önizleme + Detaylar */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="w-14 h-20 rounded-lg bg-black overflow-hidden border border-zinc-800 relative shrink-0">
                    <video
                      src={post.video_url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                      loop
                    />
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 line-clamp-2 leading-snug">
                      {post.caption}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap text-xs text-zinc-400">
                      {/* Tarih */}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        <span>{formatScheduleDate(post.schedule_time)}</span>
                      </div>

                      <span>•</span>

                      {/* Platform Rozetleri */}
                      <div className="flex items-center gap-1.5">
                        {post.platforms.includes('YOUTUBE') && (
                          <span
                            title="YouTube Shorts"
                            className="p-1 rounded bg-red-950/30 text-red-400 border border-red-900/40 flex items-center justify-center"
                          >
                            <YouTubeIcon className="w-3 h-3" />
                          </span>
                        )}
                        {post.platforms.includes('INSTAGRAM') && (
                          <span
                            title="Instagram Reels"
                            className="p-1 rounded bg-pink-950/30 text-pink-400 border border-pink-900/40 flex items-center justify-center"
                          >
                            <InstagramIcon className="w-3 h-3" />
                          </span>
                        )}
                        {post.platforms.includes('TIKTOK') && (
                          <span
                            title="TikTok"
                            className="p-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center"
                          >
                            <TikTokIcon className="w-3 h-3" />
                          </span>
                        )}
                      </div>

                      {/* Hedef Hesaplar */}
                      {post.target_account_names && post.target_account_names.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1 flex-wrap">
                            {post.target_account_names.map((name, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 text-[10px]"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sağ: Durum Rozeti & Aksiyonlar */}
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
                  {/* Status Pill */}
                  <div>
                    {post.status === 'PENDING' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/40 text-amber-400 border border-amber-800/40">
                        <Clock className="w-3 h-3" /> Zamanlandı
                      </span>
                    )}
                    {post.status === 'PROCESSING' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-950/40 text-blue-400 border border-blue-800/40">
                        <Loader2 className="w-3 h-3 animate-spin" /> Yayınlanıyor...
                      </span>
                    )}
                    {post.status === 'DONE' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                        <CheckCircle2 className="w-3 h-3" /> Yayınlandı
                      </span>
                    )}
                    {post.status === 'FAILED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-950/40 text-red-400 border border-red-800/40">
                        <AlertCircle className="w-3 h-3" /> Hata Oluştu
                      </span>
                    )}
                  </div>

                  {/* Butonlar */}
                  <div className="flex items-center gap-1.5">
                    {/* Log Görüntüle */}
                    {post.log && (
                      <button
                        type="button"
                        onClick={() => setActiveLogPost(post)}
                        title="İşlem Logunu Gör"
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Hemen Yayınla (Eğer henüz bitmediyse) */}
                    {post.status !== 'DONE' && (
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handlePublishNow(post.id)}
                        title="Hemen Şimdi Yayınla"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                        <span className="hidden sm:inline">Şimdi Gönder</span>
                      </button>
                    )}

                    {/* Sil */}
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleDelete(post.id)}
                      title="Sil"
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950/60 hover:text-red-400 text-zinc-400 transition disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Log Modalı */}
      <LogModal
        isOpen={Boolean(activeLogPost)}
        onClose={() => setActiveLogPost(null)}
        title={activeLogPost?.caption || ''}
        log={activeLogPost?.log || null}
      />
    </div>
  );
}
