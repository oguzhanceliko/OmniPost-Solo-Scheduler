'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, Film, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useUploadThing } from '@/lib/uploadthing-client';

interface VideoUploaderProps {
  uploadedUrl: string | null;
  uploadedKey: string | null;
  onUploadSuccess: (publicUrl: string, key: string) => void;
  onClear: () => void;
  isUploading: boolean;
  setIsUploading: (val: boolean) => void;
}

export function VideoUploader({
  uploadedUrl,
  uploadedKey,
  onUploadSuccess,
  onClear,
  isUploading,
  setIsUploading,
}: VideoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [videoMeta, setVideoMeta] = useState<{
    name: string;
    sizeMb: string;
    duration?: number;
    isVertical?: boolean;
  } | null>(null);

  const { startUpload: utUpload } = useUploadThing('videoUploader', {
    onUploadProgress: (p) => {
      setUploadProgress(p);
    },
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        const fileData = res[0];
        const publicUrl = fileData.ufsUrl || fileData.url;
        const key = fileData.key;
        setIsUploading(false);
        setUploadProgress(100);
        onUploadSuccess(publicUrl, key);
      }
    },
    onUploadError: (err) => {
      console.warn('UploadThing upload error:', err);
    },
  });

  const processFile = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      setErrorMessage('Lütfen geçerli bir video dosyası (MP4, MOV, WebM) seçin.');
      return;
    }

    setErrorMessage(null);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

    // Video metadata okuma
    const tempUrl = URL.createObjectURL(file);
    const tempVideo = document.createElement('video');
    tempVideo.src = tempUrl;
    tempVideo.preload = 'metadata';

    tempVideo.onloadedmetadata = async () => {
      const isVertical = tempVideo.videoHeight >= tempVideo.videoWidth;
      const duration = Math.round(tempVideo.duration);
      URL.revokeObjectURL(tempUrl);

      setVideoMeta({
        name: file.name,
        sizeMb,
        duration,
        isVertical,
      });

      // Yükleme işlemini başlat
      await startUpload(file);
    };

    tempVideo.onerror = async () => {
      URL.revokeObjectURL(tempUrl);
      setVideoMeta({
        name: file.name,
        sizeMb,
      });
      await startUpload(file);
    };
  };

  const startUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);

    // 1. Doğrudan UploadThing CDN Yüklemesi
    try {
      const utRes = await utUpload([file]);
      if (utRes && utRes[0]) {
        const fileData = utRes[0];
        const publicUrl = fileData.ufsUrl || fileData.url;
        const key = fileData.key;
        setIsUploading(false);
        setUploadProgress(100);
        onUploadSuccess(publicUrl, key);
        return;
      }
    } catch (utErr) {
      console.warn('UploadThing hatası, alternatif yükleme deneniyor:', utErr);
    }

    // 2. Alternatif: Presigned / Sunucu Yüklemesi
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || 'video/mp4',
        }),
      });

      if (!res.ok) {
        throw new Error('Yükleme bağlantısı alınamadı.');
      }

      const { uploadUrl, publicUrl, key } = await res.json();

      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setIsUploading(false);
          setUploadProgress(100);
          onUploadSuccess(publicUrl, key);
        } else {
          setIsUploading(false);
          setErrorMessage('Video yükleme sunucu tarafından reddedildi.');
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        setErrorMessage('Yükleme sırasında ağ hatası oluştu.');
      };

      xhr.send(file);
    } catch (err: unknown) {
      setIsUploading(false);
      const msg = err instanceof Error ? err.message : 'Yükleme başlatılamadı';
      setErrorMessage(msg);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleReset = () => {
    onClear();
    setVideoMeta(null);
    setUploadProgress(0);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
        1. Dikey Video Yükle
      </label>

      {uploadedUrl ? (
        <div className="relative rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-16 h-24 rounded-lg bg-black overflow-hidden border border-zinc-700/60 relative shrink-0">
              <video
                src={uploadedUrl}
                className="w-full h-full object-cover"
                playsInline
                muted
                loop
                autoPlay
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="truncate max-w-[220px] sm:max-w-xs">
                  {videoMeta?.name || 'Video yüklendi'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                {videoMeta?.sizeMb && <span>{videoMeta.sizeMb} MB</span>}
                {videoMeta?.duration && <span>• {videoMeta.duration} sn</span>}
                {videoMeta?.isVertical === false && (
                  <span className="text-amber-400">(Yatay Video)</span>
                )}
                {videoMeta?.isVertical && (
                  <span className="text-emerald-400 font-mono">9:16 Dikey</span>
                )}
              </div>
              <div className="text-[11px] text-zinc-500 font-mono truncate max-w-sm">
                Key: {uploadedKey}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
          >
            <X className="w-3.5 h-3.5" />
            <span>Kaldır</span>
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer transition ${
            dragOver
              ? 'border-zinc-500 bg-zinc-900/80'
              : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/50'
          } ${isUploading ? 'pointer-events-none opacity-80' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            className="hidden"
            onChange={handleFileInput}
          />

          {isUploading ? (
            <div className="w-full max-w-xs space-y-3">
              <Film className="w-8 h-8 text-zinc-400 mx-auto animate-pulse" />
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-zinc-400 font-medium">
                  <span>Yükleniyor...</span>
                  <span className="font-mono">{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-300 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-zinc-500">
                Orijinal kalitede doğrudan bulut depolamaya aktarılıyor
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center mx-auto text-zinc-300">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-sm font-medium text-zinc-200">
                Dikey videoyu buraya sürükleyin veya <span className="underline">seçin</span>
              </div>
              <p className="text-xs text-zinc-500">
                MP4 veya MOV • Tercihen 9:16 ve &lt; 60 saniye • Orijinal kalite bozulmaz
              </p>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
