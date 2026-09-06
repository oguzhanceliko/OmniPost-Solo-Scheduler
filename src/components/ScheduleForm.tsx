'use client';

import React, { useState, useEffect } from 'react';
import { Platform, Account } from '@/types';
import {
  Calendar,
  Send,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  Loader2,
  Users,
  Plus,
  Info,
} from 'lucide-react';
import { YouTubeIcon, InstagramIcon, TikTokIcon } from './icons';

interface ScheduleFormProps {
  uploadedUrl: string | null;
  uploadedKey: string | null;
  accounts?: Account[];
  onOpenAccounts?: () => void;
  onPostCreated: () => void;
}

export function ScheduleForm({
  uploadedUrl,
  uploadedKey,
  accounts = [],
  onOpenAccounts,
  onPostCreated,
}: ScheduleFormProps) {
  // Form State
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([
    'YOUTUBE',
    'INSTAGRAM',
    'TIKTOK',
  ]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [scheduleTime, setScheduleTime] = useState('');
  const [showCustomCaptions, setShowCustomCaptions] = useState(false);
  const [ytCustom, setYtCustom] = useState('');
  const [igCustom, setIgCustom] = useState('');
  const [ttCustom, setTtCustom] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Otomatik olarak tüm aktif hesapları varsayılan seçili yap
  useEffect(() => {
    if (accounts.length > 0) {
      setSelectedAccountIds(accounts.filter((a) => a.is_active).map((a) => a.id));
    }
  }, [accounts]);

  // Platform toggle helper
  const togglePlatform = (p: Platform) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length === 1) return; // En az 1 platform seçili kalmalı
      setSelectedPlatforms(selectedPlatforms.filter((item) => item !== p));
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  // Hesap seçimi toggle
  const toggleAccount = (id: string) => {
    if (selectedAccountIds.includes(id)) {
      setSelectedAccountIds(selectedAccountIds.filter((accId) => accId !== id));
    } else {
      setSelectedAccountIds([...selectedAccountIds, id]);
    }
  };

  // Hızlı saat atama butonları
  const applyQuickTime = (hoursToAdd: number) => {
    const d = new Date();
    d.setHours(d.getHours() + hoursToAdd);
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
    setScheduleTime(formatted);
  };

  const setSpecificHour = (hour: number, tomorrow = false) => {
    const d = new Date();
    if (tomorrow) d.setDate(d.getDate() + 1);
    d.setHours(hour, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
    setScheduleTime(formatted);
  };

  const handleSubmit = async (publishImmediately: boolean = false) => {
    if (!uploadedUrl) {
      setSubmitError('Lütfen önce bir video yükleyin.');
      return;
    }
    if (!caption.trim()) {
      setSubmitError('Lütfen video için bir başlık yazın.');
      return;
    }
    if (!publishImmediately && !scheduleTime) {
      setSubmitError('Lütfen bir yayınlanma tarihi ve saati seçin.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const targetScheduleTime = publishImmediately
        ? new Date(Date.now() - 1000).toISOString()
        : new Date(scheduleTime).toISOString();

      const custom_captions: Record<string, string> = {};
      if (ytCustom.trim()) custom_captions.youtube = ytCustom.trim();
      if (igCustom.trim()) custom_captions.instagram = igCustom.trim();
      if (ttCustom.trim()) custom_captions.tiktok = ttCustom.trim();

      // Seçilen hesap isimlerini hazırla (YALNIZCA seçili platformlara ait olanlar)
      const targetAccounts = accounts
        .filter((a) => selectedPlatforms.includes(a.platform))
        .filter((a) => selectedAccountIds.includes(a.id));
      const targetAccountNames = targetAccounts.map((a) => `${a.platform}: ${a.name}`);

      // 1. Gönderiyi oluştur
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_url: uploadedUrl,
          video_key: uploadedKey,
          caption: caption.trim(),
          description: description.trim() || undefined,
          custom_captions: Object.keys(custom_captions).length > 0 ? custom_captions : undefined,
          schedule_time: targetScheduleTime,
          platforms: selectedPlatforms,
          target_account_ids: targetAccounts.length > 0 ? targetAccounts.map((a) => a.id) : undefined,
          target_account_names: targetAccountNames.length > 0 ? targetAccountNames : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gönderi oluşturulamadı.');
      }

      // Eğer "Hemen Yayınla" tıklandıysa, anında API'yi tetikle
      if (publishImmediately && data.post?.id) {
        await fetch('/api/posts/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: data.post.id }),
        });
      }

      // Başarılı, formu sıfırla
      setCaption('');
      setDescription('');
      setYtCustom('');
      setIgCustom('');
      setTtCustom('');
      setScheduleTime('');
      setShowCustomCaptions(false);
      onPostCreated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kayıt sırasında hata oluştu';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ytAccounts = accounts.filter((a) => a.platform === 'YOUTUBE');
  const igAccounts = accounts.filter((a) => a.platform === 'INSTAGRAM');
  const ttAccounts = accounts.filter((a) => a.platform === 'TIKTOK');

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
          2. Başlık
        </label>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Videonuz için başlık yazın..."
          className="w-full rounded-xl bg-zinc-900/80 border border-zinc-800 p-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition"
        />
        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <span>YouTube: max 100 • TikTok: max 150 • Instagram: başlık yok (açıklamaya eklenir)</span>
          <span>{caption.length} karakter</span>
        </div>
      </div>

      {/* Açıklama */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
          3. Açıklama
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Videonuz için açıklama ve hashtag'ler yazın..."
          rows={3}
          className="w-full rounded-xl bg-zinc-900/80 border border-zinc-800 p-3.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition resize-none"
        />
        <div className="flex items-center justify-between text-[11px] text-zinc-500">
          <span>YouTube açıklaması • Instagram & TikTok'ta başlıkla birleştirilir</span>
          <span>{description.length} karakter</span>
        </div>
      </div>

      {/* Platform Seçimi */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
          4. Hedef Platformlar & Hesap Seçimi
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* YouTube Shorts */}
          <button
            type="button"
            onClick={() => togglePlatform('YOUTUBE')}
            className={`flex items-center justify-between p-3 rounded-xl border transition text-left ${
              selectedPlatforms.includes('YOUTUBE')
                ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
                : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:border-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-red-950/40 border border-red-900/60 flex items-center justify-center text-red-400">
                <YouTubeIcon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium">YouTube Shorts</span>
            </div>
            <div
              className={`w-4 h-4 rounded flex items-center justify-center text-[10px] border ${
                selectedPlatforms.includes('YOUTUBE')
                  ? 'bg-zinc-200 text-black border-zinc-200 font-bold'
                  : 'border-zinc-800'
              }`}
            >
              {selectedPlatforms.includes('YOUTUBE') && <Check className="w-3 h-3" />}
            </div>
          </button>

          {/* Instagram Reels */}
          <button
            type="button"
            onClick={() => togglePlatform('INSTAGRAM')}
            className={`flex items-center justify-between p-3 rounded-xl border transition text-left ${
              selectedPlatforms.includes('INSTAGRAM')
                ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
                : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:border-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-pink-950/40 border border-pink-900/60 flex items-center justify-center text-pink-400">
                <InstagramIcon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium">Instagram Reels</span>
            </div>
            <div
              className={`w-4 h-4 rounded flex items-center justify-center text-[10px] border ${
                selectedPlatforms.includes('INSTAGRAM')
                  ? 'bg-zinc-200 text-black border-zinc-200 font-bold'
                  : 'border-zinc-800'
              }`}
            >
              {selectedPlatforms.includes('INSTAGRAM') && <Check className="w-3 h-3" />}
            </div>
          </button>

          {/* TikTok */}
          <button
            type="button"
            onClick={() => togglePlatform('TIKTOK')}
            className={`flex items-center justify-between p-3 rounded-xl border transition text-left ${
              selectedPlatforms.includes('TIKTOK')
                ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
                : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:border-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                <TikTokIcon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium">TikTok</span>
            </div>
            <div
              className={`w-4 h-4 rounded flex items-center justify-center text-[10px] border ${
                selectedPlatforms.includes('TIKTOK')
                  ? 'bg-zinc-200 text-black border-zinc-200 font-bold'
                  : 'border-zinc-800'
              }`}
            >
              {selectedPlatforms.includes('TIKTOK') && <Check className="w-3 h-3" />}
            </div>
          </button>
        </div>

        {/* HESAP SEÇİM BÖLÜMÜ (Yalnızca kayıtlı hesap varsa gösterilir) */}
        {accounts.length > 0 && (
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                Paylaşım Yapılacak Hesaplar:
              </span>
              {onOpenAccounts && (
                <button
                  type="button"
                  onClick={onOpenAccounts}
                  className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>Hesap Ekle / Düzenle</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {/* YouTube Seçili İse ve YouTube hesabı varsa */}
              {selectedPlatforms.includes('YOUTUBE') && ytAccounts.length > 0 && (
                <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 text-red-400 font-medium">
                    <YouTubeIcon className="w-3.5 h-3.5" /> YouTube Kanalı:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ytAccounts.map((acc) => {
                      const isSel = selectedAccountIds.includes(acc.id);
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => toggleAccount(acc.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition border ${
                            isSel
                              ? 'bg-zinc-800 border-zinc-600 text-white font-medium'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded flex items-center justify-center text-[8px] border ${
                              isSel ? 'bg-zinc-100 text-black border-zinc-100' : 'border-zinc-700'
                            }`}
                          >
                            {isSel && <Check className="w-2 h-2" />}
                          </div>
                          <span>{acc.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Instagram Seçili İse ve Instagram hesabı varsa */}
              {selectedPlatforms.includes('INSTAGRAM') && igAccounts.length > 0 && (
                <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 text-pink-400 font-medium">
                    <InstagramIcon className="w-3.5 h-3.5" /> Instagram Hesabı:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {igAccounts.map((acc) => {
                      const isSel = selectedAccountIds.includes(acc.id);
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => toggleAccount(acc.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition border ${
                            isSel
                              ? 'bg-zinc-800 border-zinc-600 text-white font-medium'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded flex items-center justify-center text-[8px] border ${
                              isSel ? 'bg-zinc-100 text-black border-zinc-100' : 'border-zinc-700'
                            }`}
                          >
                            {isSel && <Check className="w-2 h-2" />}
                          </div>
                          <span>{acc.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TikTok Seçili İse ve TikTok hesabı varsa */}
              {selectedPlatforms.includes('TIKTOK') && ttAccounts.length > 0 && (
                <div className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 flex-wrap gap-2">
                  <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                    <TikTokIcon className="w-3.5 h-3.5" /> TikTok Hesabı:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ttAccounts.map((acc) => {
                      const isSel = selectedAccountIds.includes(acc.id);
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => toggleAccount(acc.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition border ${
                            isSel
                              ? 'bg-zinc-800 border-zinc-600 text-white font-medium'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded flex items-center justify-center text-[8px] border ${
                              isSel ? 'bg-zinc-100 text-black border-zinc-100' : 'border-zinc-700'
                            }`}
                          >
                            {isSel && <Check className="w-2 h-2" />}
                          </div>
                          <span>{acc.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* İsteğe Bağlı: Platforma Özel Başlık / Açıklama Akordeon */}
      <div className="border border-zinc-800/80 rounded-xl bg-zinc-900/30 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowCustomCaptions(!showCustomCaptions)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-medium text-zinc-300 hover:text-white transition"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span>Platforma Özel Başlık / Açıklama (İsteğe Bağlı)</span>
          </div>
          {showCustomCaptions ? (
            <ChevronUp className="w-4 h-4 text-zinc-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500" />
          )}
        </button>

        {showCustomCaptions && (
          <div className="p-4 pt-1 space-y-4 border-t border-zinc-800/60 bg-zinc-950/40">
            {selectedPlatforms.includes('YOUTUBE') && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                  <span className="flex items-center gap-1.5 text-red-400">
                    <YouTubeIcon className="w-3.5 h-3.5" /> YouTube Shorts Özel Başlığı
                  </span>
                  <span>{ytCustom.length}/100</span>
                </div>
                <input
                  type="text"
                  maxLength={100}
                  value={ytCustom}
                  onChange={(e) => setYtCustom(e.target.value)}
                  placeholder="Boş bırakılırsa ortak başlık kullanılır"
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>
            )}

            {selectedPlatforms.includes('INSTAGRAM') && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                  <span className="flex items-center gap-1.5 text-pink-400">
                    <InstagramIcon className="w-3.5 h-3.5" /> Instagram Reels Açıklaması & Etiketler
                  </span>
                  <span>{igCustom.length} karakter</span>
                </div>
                <textarea
                  rows={2}
                  value={igCustom}
                  onChange={(e) => setIgCustom(e.target.value)}
                  placeholder="Boş bırakılırsa ortak açıklama kullanılır"
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 resize-none"
                />
              </div>
            )}

            {selectedPlatforms.includes('TIKTOK') && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium">
                  <span className="flex items-center gap-1.5 text-zinc-300">
                    <TikTokIcon className="w-3.5 h-3.5" /> TikTok Başlığı
                  </span>
                  <span>{ttCustom.length}/150</span>
                </div>
                <input
                  type="text"
                  maxLength={150}
                  value={ttCustom}
                  onChange={(e) => setTtCustom(e.target.value)}
                  placeholder="Boş bırakılırsa ortak başlık kullanılır"
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-800 p-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tarih ve Zaman Seçici */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
          5. Yayınlanma Zamanı
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="datetime-local"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              className="w-full rounded-xl bg-zinc-900/80 border border-zinc-800 px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 scheme-dark"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => applyQuickTime(1)}
              className="px-2.5 py-2 text-xs rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition"
            >
              +1 Saat
            </button>
            <button
              type="button"
              onClick={() => applyQuickTime(3)}
              className="px-2.5 py-2 text-xs rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition"
            >
              +3 Saat
            </button>
            <button
              type="button"
              onClick={() => setSpecificHour(18)}
              className="px-2.5 py-2 text-xs rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition"
            >
              Bugün 18:00
            </button>
            <button
              type="button"
              onClick={() => setSpecificHour(12, true)}
              className="px-2.5 py-2 text-xs rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition"
            >
              Yarın 12:00
            </button>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="p-3 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg">
          {submitError}
        </div>
      )}

      {/* Aksiyon Butonları */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        <button
          type="button"
          disabled={isSubmitting || !uploadedUrl}
          onClick={() => handleSubmit(true)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 transition disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4 text-zinc-400" />
          )}
          <span>Hemen Şimdi Yayınla</span>
        </button>

        <button
          type="button"
          disabled={isSubmitting || !uploadedUrl}
          onClick={() => handleSubmit(false)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition shadow-sm disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin text-zinc-900" />
          ) : (
            <Calendar className="w-4 h-4" />
          )}
          <span>İleri Tarihe Planla</span>
        </button>
      </div>
    </div>
  );
}
