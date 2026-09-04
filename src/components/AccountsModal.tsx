'use client';

import React, { useState } from 'react';
import { Account, Platform } from '@/types';
import { YouTubeIcon, InstagramIcon, TikTokIcon } from './icons';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  Users,
  KeyRound,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

interface AccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onRefresh: () => void;
}

export function AccountsModal({
  isOpen,
  onClose,
  accounts,
  onRefresh,
}: AccountsModalProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('YOUTUBE');
  const [name, setName] = useState('');
  // YouTube credentials
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  // Instagram credentials
  const [igAccountId, setIgAccountId] = useState('');
  const [igAccessToken, setIgAccessToken] = useState('');
  // TikTok credentials
  const [ttAccessToken, setTtAccessToken] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Lütfen bir hesap/kanal adı girin.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const credentials: Record<string, string> = {};
      if (selectedPlatform === 'YOUTUBE') {
        if (clientId) credentials.clientId = clientId.trim();
        if (clientSecret) credentials.clientSecret = clientSecret.trim();
        if (refreshToken) credentials.refreshToken = refreshToken.trim();
      } else if (selectedPlatform === 'INSTAGRAM') {
        if (igAccountId) credentials.instagramAccountId = igAccountId.trim();
        if (igAccessToken) credentials.instagramAccessToken = igAccessToken.trim();
      } else if (selectedPlatform === 'TIKTOK') {
        if (ttAccessToken) credentials.tiktokAccessToken = ttAccessToken.trim();
      }

      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          name: name.trim(),
          credentials,
          is_active: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Hesap eklenemedi.');
      }

      // Reset
      setName('');
      setClientId('');
      setClientSecret('');
      setRefreshToken('');
      setIgAccountId('');
      setIgAccessToken('');
      setTtAccessToken('');
      setIsAdding(false);
      onRefresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Hesap kaydedilemedi';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu hesabı kaldırmak istediğinizden emin misiniz?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/accounts?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onRefresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Başlık */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-zinc-300" />
            <h3 className="text-sm font-semibold text-zinc-100">
              Bağlı Hesaplar & API Ayarları
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
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Bilgilendirme Notu */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              Burada eklediğiniz hesaplar doğrudan veritabanınızda güvenle saklanır.
              Vercel üzerinde yeniden deploy etmenize gerek kalmadan istediğiniz kadar YouTube kanalı,
              Instagram veya TikTok hesabı ekleyebilir ve tek formdan yönetebilirsiniz.
            </div>
          </div>

          {/* Mevcut Hesaplar Listesi */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Kayıtlı Hesaplar ({accounts.length})
              </span>
              {!isAdding && (
                <button
                  type="button"
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-1 text-xs font-medium text-zinc-200 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1.5 rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Hesap Ekle</span>
                </button>
              )}
            </div>

            {accounts.length === 0 && !isAdding ? (
              <div className="p-6 rounded-xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                Henüz kayıtlı özel hesap yok. (Sistem varsayılan olarak .env dosyalarındaki değerleri kullanır).
                Farklı kanallar eklemek için "Yeni Hesap Ekle" butonuna basabilirsiniz.
              </div>
            ) : (
              <div className="space-y-2">
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700">
                        {acc.platform === 'YOUTUBE' && <YouTubeIcon className="w-4 h-4 text-red-400" />}
                        {acc.platform === 'INSTAGRAM' && <InstagramIcon className="w-4 h-4 text-pink-400" />}
                        {acc.platform === 'TIKTOK' && <TikTokIcon className="w-4 h-4 text-zinc-300" />}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">{acc.name}</div>
                        <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>{acc.platform}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={deletingId === acc.id}
                      onClick={() => handleDelete(acc.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition"
                    >
                      {deletingId === acc.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Yeni Hesap Ekleme Formu */}
          {isAdding && (
            <form onSubmit={handleCreate} className="p-4 rounded-xl border border-zinc-700/80 bg-zinc-900/90 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                  Yeni Hesap Tanımla
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  İptal
                </button>
              </div>

              {/* Platform Seçimi */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-400">Platform</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['YOUTUBE', 'INSTAGRAM', 'TIKTOK'] as Platform[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedPlatform(p)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                        selectedPlatform === p
                          ? 'bg-zinc-800 border-zinc-600 text-white'
                          : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                      }`}
                    >
                      {p === 'YOUTUBE' && <YouTubeIcon className="w-3.5 h-3.5 text-red-400" />}
                      {p === 'INSTAGRAM' && <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />}
                      {p === 'TIKTOK' && <TikTokIcon className="w-3.5 h-3.5 text-zinc-300" />}
                      <span>{p === 'YOUTUBE' ? 'YouTube' : p === 'INSTAGRAM' ? 'Instagram' : 'TikTok'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hesap Adı */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-400">
                  Hesap / Kanal Görünür Adı
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Ana YouTube Kanalı, Mizah Sayfası veya @kullaniciadi"
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              {/* Dinamik Kimlik Alanları */}
              {selectedPlatform === 'YOUTUBE' && (
                <div className="space-y-2.5 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-400">YouTube Client ID</label>
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="xxxx.apps.googleusercontent.com"
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 font-mono focus:outline-none focus:border-zinc-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-400">YouTube Client Secret</label>
                    <input
                      type="password"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="GOCSPX-xxxx"
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 font-mono focus:outline-none focus:border-zinc-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-400">YouTube Refresh Token</label>
                    <input
                      type="password"
                      value={refreshToken}
                      onChange={(e) => setRefreshToken(e.target.value)}
                      placeholder="1//0xxxx"
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 font-mono focus:outline-none focus:border-zinc-600"
                    />
                  </div>
                </div>
              )}

              {selectedPlatform === 'INSTAGRAM' && (
                <div className="space-y-2.5 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-400">Instagram Account ID</label>
                    <input
                      type="text"
                      value={igAccountId}
                      onChange={(e) => setIgAccountId(e.target.value)}
                      placeholder="178414xxxx"
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 font-mono focus:outline-none focus:border-zinc-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-400">Instagram Long-Lived Access Token</label>
                    <input
                      type="password"
                      value={igAccessToken}
                      onChange={(e) => setIgAccessToken(e.target.value)}
                      placeholder="EAAKxxxx"
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 font-mono focus:outline-none focus:border-zinc-600"
                    />
                  </div>
                </div>
              )}

              {selectedPlatform === 'TIKTOK' && (
                <div className="space-y-3 pt-1">
                  <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs space-y-2">
                    <div className="font-medium text-zinc-200">1. Yöntem: Tek Tıkla Bağlan (Önerilen)</div>
                    <p className="text-[11px] text-zinc-400">
                      Aşağıdaki butona basarak TikTok hesabınızdan video paylaşım iznini doğrudan verebilirsiniz:
                    </p>
                    <a
                      href="https://www.tiktok.com/v2/auth/authorize/?client_key=awmjlpck32jcq70n&scope=user.info.basic,video.upload,video.publish&response_type=code&redirect_uri=https://omnipost-eosin.vercel.app/api/auth/tiktok/callback&state=omnipost"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition shadow-sm"
                    >
                      <TikTokIcon className="w-3.5 h-3.5" />
                      <span>TikTok ile Hesabı Bağla →</span>
                    </a>
                  </div>

                  <div className="relative flex items-center justify-center my-2">
                    <div className="border-t border-zinc-800 w-full"></div>
                    <span className="bg-zinc-900 px-2 text-[10px] text-zinc-500 uppercase tracking-wider absolute">veya manuel</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-zinc-400">TikTok Access Token</label>
                    <input
                      type="password"
                      value={ttAccessToken}
                      onChange={(e) => setTtAccessToken(e.target.value)}
                      placeholder="act.xxxx"
                      className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 font-mono focus:outline-none focus:border-zinc-600"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-2 text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Hesabı Kaydet</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Alt Kısım */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
}
