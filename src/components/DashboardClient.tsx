'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/Header';
import { VideoUploader } from '@/components/VideoUploader';
import { ScheduleForm } from '@/components/ScheduleForm';
import { PostList } from '@/components/PostList';
import { ScheduledPost } from '@/types';
import { PlusCircle, ListFilter } from 'lucide-react';

export default function DashboardClient() {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedKey, setUploadedKey] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(true);

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

  useEffect(() => {
    fetchPosts();
    // Her 20 saniyede bir durumu güncelle (yayınlanan gönderileri canlı görmek için)
    const interval = setInterval(fetchPosts, 20000);
    return () => clearInterval(interval);
  }, [fetchPosts]);

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
      <Header />

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
              onPostCreated={handlePostCreated}
            />
          </div>
        </section>

        {/* Alt Alan: Planlanan ve Gönderilenler Listesi */}
        <section className="rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-zinc-300" />
              <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
                Planlanmış ve Yayınlanmış İçerikler
              </h2>
            </div>
          </div>

          <div className="p-6">
            <PostList
              posts={posts}
              isLoading={isLoadingPosts}
              onRefresh={fetchPosts}
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
        <p>OmniPost Solo Scheduler • Sıfır Maliyetli Dikey Video Otomasyonu</p>
      </footer>
    </div>
  );
}
