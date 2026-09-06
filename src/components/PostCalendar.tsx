'use client';

import React, { useState, useMemo } from 'react';
import { ScheduledPost, PostStatus } from '@/types';
import { LogModal } from './LogModal';
import { YouTubeIcon, InstagramIcon, TikTokIcon } from './icons';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Eye,
  Sparkles,
} from 'lucide-react';

interface PostCalendarProps {
  posts: ScheduledPost[];
  onRefresh: () => void;
  onSelectDate?: (dateStr: string) => void;
}

type CalendarViewMode = 'MONTH' | 'WEEK';

export function PostCalendar({ posts, onRefresh, onSelectDate }: PostCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('WEEK');
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | PostStatus>('ALL');

  const today = useMemo(() => new Date(), []);

  // Filtrelenmiş gönderiler
  const filteredPosts = useMemo(() => {
    if (statusFilter === 'ALL') return posts;
    return posts.filter((p) => p.status === statusFilter);
  }, [posts, statusFilter]);

  // Günün başlangıcı ve bitişi karşılaştırması için helper
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Navigasyon
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'MONTH') {
      d.setMonth(d.getMonth() - 1);
    } else {
      d.setDate(d.getDate() - 7);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'MONTH') {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Hafta günlerini hesapla (Pazartesi başlangıçlı)
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const day = curr.getDay();
    // Pazar = 0, Pazartesi = 1 ... Cumartesi = 6
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi
    const monday = new Date(curr.setDate(diff));

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push(nextDay);
    }
    return days;
  }, [currentDate]);

  // Ay günlerini hesapla (Pazartesi başlangıçlı ızgara)
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Ayın ilk gününün haftadaki konumu (Pazartesi = 0)
    let firstDayIndex = firstDayOfMonth.getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6;

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Önceki aydan taşan günler
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
      });
    }

    // Mevcut ayın günleri
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Sonraki aydan taşan günler (42 güne tamamla: 6 satır x 7 sütun)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // Belirli bir güne ait gönderileri çek
  const getPostsForDate = (date: Date) => {
    return filteredPosts.filter((post) => {
      try {
        const postDate = new Date(post.schedule_time);
        return isSameDay(postDate, date);
      } catch {
        return false;
      }
    });
  };

  // Başlık formatlama (Örn: "31 - 6 Eylül 2026" veya "Eylül 2026")
  const headerTitle = useMemo(() => {
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    if (viewMode === 'MONTH') {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else {
      const first = weekDays[0];
      const last = weekDays[6];

      if (first.getMonth() === last.getMonth()) {
        return `${first.getDate()} - ${last.getDate()} ${monthNames[first.getMonth()]} ${first.getFullYear()}`;
      } else {
        return `${first.getDate()} ${monthNames[first.getMonth()]} - ${last.getDate()} ${monthNames[last.getMonth()]} ${last.getFullYear()}`;
      }
    }
  }, [currentDate, viewMode, weekDays]);

  const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const dayNamesShort = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  return (
    <div className="space-y-4">
      {/* Üst Bar: Navigasyon ve Butonlar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-md">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-100">{headerTitle}</h3>
            </div>
            <p className="text-[11px] text-zinc-400">Zamanlanmış ve yayınlanmış tüm dikey videolarınız</p>
          </div>
        </div>

        {/* Kontrol Butonları */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Durum Filtreleri */}
          <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 text-[11px]">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2 py-1 rounded-lg transition font-medium ${
                statusFilter === 'ALL' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Tümü
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-2 py-1 rounded-lg transition font-medium ${
                statusFilter === 'PENDING' ? 'bg-zinc-800 text-amber-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Bekleyen
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DONE')}
              className={`px-2 py-1 rounded-lg transition font-medium ${
                statusFilter === 'DONE' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Tamamlanan
            </button>
          </div>

          {/* Aylık / Haftalık Görünüm Değiştirici */}
          <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 text-[11px]">
            <button
              type="button"
              onClick={() => setViewMode('WEEK')}
              className={`px-2.5 py-1 rounded-lg transition font-medium ${
                viewMode === 'WEEK' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Haftalık
            </button>
            <button
              type="button"
              onClick={() => setViewMode('MONTH')}
              className={`px-2.5 py-1 rounded-lg transition font-medium ${
                viewMode === 'MONTH' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Aylık
            </button>
          </div>

          {/* İleri / Geri / Bugün */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 transition"
            >
              Bugün
            </button>
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
              title="Önceki"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
              title="Sonraki"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= HAFTALIK GÖRÜNÜM ================= */}
      {viewMode === 'WEEK' && (
        <div className="rounded-2xl bg-zinc-950/90 border border-zinc-800/80 shadow-xl overflow-hidden">
          {/* Gün Başlıkları */}
          <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-900/60 divide-x divide-zinc-800/70 text-center">
            {weekDays.map((day, idx) => {
              const isCurrentDay = isSameDay(day, today);
              return (
                <div
                  key={idx}
                  className={`py-3 px-2 transition ${
                    isCurrentDay ? 'bg-amber-500/10 text-amber-300 font-semibold' : 'text-zinc-400'
                  }`}
                >
                  <div className="text-sm font-bold">{day.getDate()}</div>
                  <div className="text-[11px] font-medium">{dayNames[idx]}</div>
                </div>
              );
            })}
          </div>

          {/* Gün Sütunları & İçerikler */}
          <div className="grid grid-cols-7 min-h-[420px] divide-x divide-zinc-800/60 bg-zinc-950/40">
            {weekDays.map((day, idx) => {
              const dayPosts = getPostsForDate(day);
              const isCurrentDay = isSameDay(day, today);

              return (
                <div
                  key={idx}
                  className={`p-2 flex flex-col space-y-2 transition ${
                    isCurrentDay ? 'bg-amber-500/[0.02]' : ''
                  }`}
                >
                  {dayPosts.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-2 opacity-30">
                      <span className="text-[10px] text-zinc-600">Plan yok</span>
                    </div>
                  ) : (
                    dayPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onClick={() => setSelectedPost(post)}
                      />
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= AYLIK GÖRÜNÜM ================= */}
      {viewMode === 'MONTH' && (
        <div className="rounded-2xl bg-zinc-950/90 border border-zinc-800/80 shadow-xl overflow-hidden">
          {/* Gün İsimleri */}
          <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-900/60 divide-x divide-zinc-800/70 text-center text-xs font-semibold text-zinc-400 py-2.5">
            {dayNamesShort.map((name, i) => (
              <div key={i}>{name}</div>
            ))}
          </div>

          {/* Ay Izgarası */}
          <div className="grid grid-cols-7 divide-x divide-y divide-zinc-800/60 bg-zinc-950/40">
            {monthDays.map((item, idx) => {
              const dayPosts = getPostsForDate(item.date);
              const isCurrentDay = isSameDay(item.date, today);

              return (
                <div
                  key={idx}
                  className={`min-h-[105px] p-1.5 flex flex-col transition ${
                    !item.isCurrentMonth ? 'opacity-30 bg-zinc-950/80' : ''
                  } ${isCurrentDay ? 'bg-amber-500/[0.04]' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                        isCurrentDay
                          ? 'bg-amber-400 text-black font-bold'
                          : item.isCurrentMonth
                          ? 'text-zinc-300'
                          : 'text-zinc-600'
                      }`}
                    >
                      {item.date.getDate()}
                    </span>
                    {dayPosts.length > 0 && (
                      <span className="text-[9px] font-mono px-1 rounded bg-zinc-800 text-zinc-400">
                        {dayPosts.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto flex-1 max-h-[85px]">
                    {dayPosts.map((post) => (
                      <MiniPostChip
                        key={post.id}
                        post={post}
                        onClick={() => setSelectedPost(post)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gönderi Detay / Log Modal */}
      {selectedPost && (
        <LogModal
          isOpen={true}
          title={selectedPost.caption}
          log={selectedPost.log || null}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
}

// Haftalık Görünüm İçin Kart
function PostCard({ post, onClick }: { post: ScheduledPost; onClick: () => void }) {
  const timeStr = (() => {
    try {
      const d = new Date(post.schedule_time);
      return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  })();

  const statusConfig = {
    PENDING: {
      color: 'border-amber-500/40 bg-amber-500/5 text-amber-300',
      label: 'Bekliyor',
      dot: 'bg-amber-400',
    },
    PROCESSING: {
      color: 'border-blue-500/40 bg-blue-500/5 text-blue-300',
      label: 'Yayınlanıyor',
      dot: 'bg-blue-400 animate-pulse',
    },
    DONE: {
      color: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-300',
      label: 'Paylaşıldı',
      dot: 'bg-emerald-400',
    },
    FAILED: {
      color: 'border-red-500/40 bg-red-500/5 text-red-300',
      label: 'Hata',
      dot: 'bg-red-400',
    },
  }[post.status] || {
    color: 'border-zinc-800 bg-zinc-900 text-zinc-400',
    label: post.status,
    dot: 'bg-zinc-500',
  };

  return (
    <div
      onClick={onClick}
      className={`p-2.5 rounded-xl border text-left cursor-pointer transition hover:scale-[1.02] hover:shadow-lg space-y-2 ${statusConfig.color}`}
    >
      {/* Üst Bar: Saat & Durum */}
      <div className="flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-1 font-mono font-semibold">
          <Clock className="w-3 h-3 opacity-70" />
          <span>{timeStr}</span>
        </div>
        <div className="flex items-center gap-1 font-medium">
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
          <span>{statusConfig.label}</span>
        </div>
      </div>

      {/* Başlık */}
      <div className="text-xs font-medium text-zinc-200 line-clamp-2 leading-snug">
        {post.caption}
      </div>

      {/* Platform İkonları */}
      <div className="flex items-center gap-1 pt-1 border-t border-zinc-800/40">
        {post.platforms.includes('YOUTUBE') && <YouTubeIcon className="w-3 h-3 text-red-400" />}
        {post.platforms.includes('INSTAGRAM') && <InstagramIcon className="w-3 h-3 text-pink-400" />}
        {post.platforms.includes('TIKTOK') && <TikTokIcon className="w-3 h-3 text-zinc-300" />}
      </div>
    </div>
  );
}

// Aylık Görünüm İçin Mini Çip
function MiniPostChip({ post, onClick }: { post: ScheduledPost; onClick: () => void }) {
  const timeStr = (() => {
    try {
      const d = new Date(post.schedule_time);
      return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  })();

  const dotColor = {
    PENDING: 'bg-amber-400',
    PROCESSING: 'bg-blue-400 animate-pulse',
    DONE: 'bg-emerald-400',
    FAILED: 'bg-red-400',
  }[post.status] || 'bg-zinc-500';

  return (
    <div
      onClick={onClick}
      className="p-1 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] text-zinc-200 cursor-pointer transition flex items-center justify-between gap-1 truncate"
      title={`${timeStr} - ${post.caption}`}
    >
      <div className="flex items-center gap-1 truncate">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
        <span className="font-mono text-[9px] text-zinc-400 shrink-0">{timeStr}</span>
        <span className="truncate">{post.caption}</span>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {post.platforms.includes('YOUTUBE') && <YouTubeIcon className="w-2.5 h-2.5 text-red-400" />}
        {post.platforms.includes('INSTAGRAM') && <InstagramIcon className="w-2.5 h-2.5 text-pink-400" />}
        {post.platforms.includes('TIKTOK') && <TikTokIcon className="w-2.5 h-2.5 text-zinc-300" />}
      </div>
    </div>
  );
}
