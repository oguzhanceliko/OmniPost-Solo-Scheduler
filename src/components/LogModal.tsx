'use client';

import React from 'react';
import { X, Terminal } from 'lucide-react';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  log: string | null;
}

export function LogModal({ isOpen, onClose, title, log }: LogModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-200">İşlem & Hata Logu</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3">
          <div className="text-xs text-zinc-400 font-medium truncate">
            Gönderi: <span className="text-zinc-200">{title}</span>
          </div>

          <pre className="p-3.5 rounded-xl bg-black border border-zinc-800/80 font-mono text-xs text-zinc-300 whitespace-pre-wrap break-words leading-relaxed">
            {log || 'Kayıtlı log bulunmuyor.'}
          </pre>
        </div>

        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/40 flex justify-end">
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
