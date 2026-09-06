'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { VideoUploader } from '@/components/VideoUploader';
import { ScheduleForm } from '@/components/ScheduleForm';
import { PostList } from '@/components/PostList';
import { PostCalendar } from '@/components/PostCalendar';
import { AccountsModal } from '@/components/AccountsModal';
import { DownloaderModal } from '@/components/DownloaderModal';
import { ScheduledPost, Account } from '@/types';
import { PlusCircle, ListFilter, Calendar, LayoutList } from 'lucide-react';

export default function DashboardClient() {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('CALENDAR');

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState<boolean>(false);
  const [isDownloaderModalOpen, setIsDownloaderModalOpen] = useState<boolean>(false);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Gönderiler yüklenemedi:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error('Hesaplar yüklenemedi:', err);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchAccounts();
    const interval = setInterval(fetchPosts, 20000);
    return () => clearInterval(interval);
  }, [fetchPosts, fetchAccounts]);

  const handleUploadSuccess = (url: string, key: string) => {
    setUploadedUrl(url);
    setUploadedKey(key);
  };

  const handleClearUpload = () => {
    setUploadedUrl(null);
    setUploadedKey(null);
  };

  const handlePostCreated = () => {
    handleClearUpload();
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-zinc-800">
      <Header
        onOpenAccounts={() => setIsAccountsModalOpen(true)}
        onOpenDownloader={() => setIsDownloaderModalOpen(true)}
        onToggleView={() => setViewMode((v) => (v === 'LIST' ? 'CALENDAR' : 'LIST'))}
        currentView={viewMode}
        accountsCount={accounts.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Üst Alan: Yeni Gönderi Planlama Kartı */}
        <section className="rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-zinc-300" />
              <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
                Yeni Dikey Video Planla
              </h2>
            </div>
            <span className="text-xs text-zinc-500 hidden sm:inline">
              YouTube Shorts • Instagram Reels • TikTok
            </span>
          </div>

          <div className="p-6 space-y-6">
            <VideoUploader
              uploadedUrl={uploadedUrl}
              uploadedKey={uploadedKey}
              onUploadSuccess={handleUploadSuccess}
              onClear={handleClearUpload}
              isUploading={isUploading}
              setIsUploading={setIsUploading}
            />

            <ScheduleForm
              uploadedUrl={uploadedUrl}
              uploadedKey={uploadedKey}
              accounts={accounts}
              onOpenAccounts={() => setIsAccountsModalOpen(true)}
              onPostCreated={handlePostCreated}
            />
          </div>
        </section>

        {/* Alt Alan: Planlanan ve Gönderilenler (Takvim / Liste) */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
                {viewMode === 'CALENDAR' ? (
                  <Calendar className="w-4 h-4 text-amber-400" />
                ) : (
                  <ListFilter className="w-4 h-4 text-zinc-300" />
                )}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
                  {viewMode === 'CALENDAR' ? 'Video Yayın Takvimi' : 'Planlanmış ve Yayınlanmış İçerikler'}
                </h2>
                <p className="text-[11px] text-zinc-500">
                  {viewMode === 'CALENDAR'
                    ? 'Haftalık ve aylık bazda tüm video akışınız'
                    : 'Detaylı liste ve anlık gönderim kontrolleri'}
                </p>
              </div>
            </div>

            {/* Görünüm Değiştirici Butonlar */}
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('CALENDAR')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                  viewMode === 'CALENDAR'
                    ? 'bg-amber-400 text-black font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Takvim Görünümü</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('LIST')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition font-medium ${
                  viewMode === 'LIST'
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Liste Görünümü</span>
              </button>
            </div>
          </div>

          {viewMode === 'CALENDAR' ? (
            <PostCalendar posts={posts} onRefresh={fetchPosts} />
          ) : (
            <div className="rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl overflow-hidden p-6">
              <PostList
                posts={posts}
                isLoading={isLoadingPosts}
                onRefresh={fetchPosts}
              />
            </div>
          )}
        </section>
      </main>

      {/* Hesaplar ve Video İndirme Modalları */}
      <AccountsModal
        isOpen={isAccountsModalOpen}
        onClose={() => setIsAccountsModalOpen(false)}
        accounts={accounts}
        onRefresh={fetchAccounts}
      />

      <DownloaderModal
        isOpen={isDownloaderModalOpen}
        onClose={() => setIsDownloaderModalOpen(false)}
      />

      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
        <p>OmniPost Solo Scheduler • Sıfır Maliyetli Çoklu Hesap & Dikey Video Otomasyonu</p>
      </footer>
    </div>
  );
}
