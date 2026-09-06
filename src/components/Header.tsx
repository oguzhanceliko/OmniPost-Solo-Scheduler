'use client';

import React, { useEffect, useState } from 'react';
import { LogOut, Clock, Video, Download, Users, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onOpenDownloader?: () => void;
  onOpenAccounts?: () => void;
  onToggleView?: () => void;
  currentView?: 'LIST' | 'CALENDAR';
  accountsCount?: number;
}

export function Header({
  onOpenDownloader,
  onOpenAccounts,
  onToggleView,
  currentView = 'LIST',
  accountsCount = 0,
}: HeaderProps) {
  const router = useRouter();
  const [timeStr, setTimeStr] = useState<string>('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      router.push('/login');
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-100">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-white text-lg">OmniPost</span>
              <span className="text-[10px] uppercase font-medium tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                Solo Scheduler
              </span>
            </div>
            <p className="text-xs text-zinc-500 hidden sm:block">
              Shorts, Reels & TikTok Otomasyonu
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Takvim / Scheduler Butonu (Maliyet yerine) */}
          <button
            type="button"
            onClick={onToggleView}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
              currentView === 'CALENDAR'
                ? 'bg-amber-400 text-black border-amber-400 font-semibold shadow-sm'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Takvim</span>
          </button>

          {/* Video İndir Butonu */}
          <button
            type="button"
            onClick={onOpenDownloader}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-200 hover:text-white transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Video İndir</span>
          </button>

          {/* Hesaplar / Ayarlar Butonu */}
          <button
            type="button"
            onClick={onOpenAccounts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-200 hover:text-white transition"
          >
            <Users className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Hesaplar</span>
            {accountsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-800 text-zinc-300 font-mono">
                {accountsCount}
              </span>
            )}
          </button>

          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>{timeStr || '--:--:--'}</span>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Oturumu Kapat"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Çıkış</span>
          </button>
        </div>
      </div>
    </header>
  );
}
