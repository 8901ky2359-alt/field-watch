'use client';

import { useRef } from 'react';
import type { Shot } from '@/lib/types';

type Side = 'before' | 'after';

export default function PhotoSlot({
  side,
  shot,
  busy,
  onCapture,
  onPickFile,
  onDelete,
  onSaveOne,
}: {
  side: Side;
  shot: Shot | null;
  busy: boolean;
  onCapture: () => void;
  onPickFile: (file: File) => void;
  onDelete: () => void;
  onSaveOne: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isBefore = side === 'before';
  const label = isBefore ? 'Before' : 'After';
  const labelClasses = isBefore ? 'bg-before text-white' : 'bg-after text-white';
  const borderClasses = isBefore ? 'border-before' : 'border-after';

  return (
    <div className={`flex-1 border-2 ${shot ? borderClasses : 'border-slate-900'}`}>
      <div className={`py-1 text-center text-xs font-bold ${labelClasses}`}>{label}</div>

      <div className="relative aspect-[5/4] w-full bg-slate-100">
        {busy ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-8 w-8 animate-spin border-4 border-slate-300 border-t-slate-900" />
          </div>
        ) : shot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot.dataUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
            未撮影
          </div>
        )}
      </div>

      {shot ? (
        <div className="flex border-t-2 border-slate-900">
          <button
            type="button"
            onClick={onSaveOne}
            className="min-h-[40px] flex-1 border-r border-slate-900 bg-white text-xs font-bold text-slate-900"
          >
            保存
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="min-h-[40px] flex-1 bg-white text-xs font-bold text-red-600"
          >
            ×消去
          </button>
        </div>
      ) : (
        <div className="flex border-t-2 border-slate-900">
          <button
            type="button"
            onClick={onCapture}
            className="min-h-[44px] flex-1 border-r border-slate-900 bg-white text-xs font-bold text-slate-900"
          >
            撮影
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="min-h-[44px] flex-1 bg-white text-xs font-bold text-slate-900"
          >
            アルバム
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) onPickFile(file);
            }}
          />
        </div>
      )}
    </div>
  );
}
