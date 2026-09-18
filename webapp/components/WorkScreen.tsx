'use client';

import { useMemo, useState } from 'react';
import type { Project } from '@/lib/types';
import PhotoSlot from './PhotoSlot';

type Side = 'before' | 'after';

export default function WorkScreen({
  project,
  shareUrl,
  onNameChange,
  onNew,
  onRefresh,
  onCapture,
  onPickFile,
  onDeletePhoto,
  onSaveOne,
  onAddSlots,
  onSaveAll,
  onOpenShareSheet,
  busySlots,
}: {
  project: Project;
  shareUrl: string | null;
  onNameChange: (name: string) => void;
  onNew: () => void;
  onRefresh: () => void;
  onCapture: (index: number, side: Side) => void;
  onPickFile: (index: number, side: Side, file: File) => void;
  onDeletePhoto: (index: number, side: Side) => void;
  onSaveOne: (index: number, side: Side) => void;
  onAddSlots: (n: number) => void;
  onSaveAll: () => void;
  onOpenShareSheet: () => void;
  busySlots: Set<string>;
}) {
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const completed = useMemo(
    () => project.items.filter((it) => it.before && it.after).length,
    [project.items]
  );
  const totalShots = useMemo(
    () => project.items.reduce((sum, it) => sum + (it.before ? 1 : 0) + (it.after ? 1 : 0), 0),
    [project.items]
  );
  const pct = project.count > 0 ? Math.round((completed / project.count) * 100) : 0;

  function handleNew() {
    if (window.confirm('今の写真は端末から消えます（共有・保存は済ませてください）。新規作成しますか？')) {
      onNew();
    }
  }

  async function handleCopyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      window.prompt('このリンクをコピーしてください', shareUrl);
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-10 border-b-2 border-slate-900 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={project.name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="現場名（任意）"
            className="min-h-[44px] flex-1 border-2 border-slate-900 px-2 text-sm font-bold text-slate-900"
          />
          {shareUrl && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="min-h-[44px] border-2 border-slate-900 bg-white px-3 text-sm font-bold text-slate-900 disabled:opacity-40"
            >
              {refreshing ? '更新中' : '更新'}
            </button>
          )}
          <button
            type="button"
            onClick={handleNew}
            className="min-h-[44px] border-2 border-slate-900 bg-white px-3 text-sm font-bold text-slate-900"
          >
            新規
          </button>
        </div>

        {shareUrl && (
          <div className="mt-2 flex items-center gap-2 border-2 border-before bg-before-light px-2 py-1.5">
            <span className="flex-1 truncate text-xs font-bold text-slate-700">{shareUrl}</span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="min-h-[32px] shrink-0 border-2 border-before bg-before px-2 text-xs font-bold text-white"
            >
              {copied ? 'コピーしました' : '共有リンクをコピー'}
            </button>
          </div>
        )}

        <div className="mt-3 h-3 w-full border-2 border-slate-900 bg-slate-100">
          <div className="h-full bg-after" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 text-xs font-bold text-slate-600">
          完了 {completed}/{project.count}
        </div>
      </div>

      <div className="px-4 py-4">
        {project.items.map((item, i) => {
          const index = i + 1;
          return (
            <div key={index} className="mb-4 border-2 border-slate-900">
              <div className="border-b-2 border-slate-900 bg-slate-100 px-3 py-2 text-sm font-bold text-slate-900">
                {index}番
              </div>
              <div className="flex">
                <PhotoSlot
                  side="before"
                  shot={item.before}
                  busy={busySlots.has(`${index}-before`)}
                  onCapture={() => onCapture(index, 'before')}
                  onPickFile={(file) => onPickFile(index, 'before', file)}
                  onDelete={() => onDeletePhoto(index, 'before')}
                  onSaveOne={() => onSaveOne(index, 'before')}
                />
                <PhotoSlot
                  side="after"
                  shot={item.after}
                  busy={busySlots.has(`${index}-after`)}
                  onCapture={() => onCapture(index, 'after')}
                  onPickFile={(file) => onPickFile(index, 'after', file)}
                  onDelete={() => onDeletePhoto(index, 'after')}
                  onSaveOne={() => onSaveOne(index, 'after')}
                />
              </div>
            </div>
          );
        })}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onAddSlots(1)}
            className="min-h-[44px] flex-1 border-2 border-slate-900 bg-white text-xs font-bold text-slate-900"
          >
            ＋1箇所
          </button>
          <button
            type="button"
            onClick={() => onAddSlots(5)}
            className="min-h-[44px] flex-1 border-2 border-slate-900 bg-white text-xs font-bold text-slate-900"
          >
            ＋5箇所
          </button>
          <button
            type="button"
            onClick={() => onAddSlots(10)}
            className="min-h-[44px] flex-1 border-2 border-slate-900 bg-white text-xs font-bold text-slate-900"
          >
            ＋10箇所
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 z-10 w-full max-w-md -translate-x-1/2 border-t-2 border-slate-900 bg-white p-3">
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!totalShots}
            onClick={onSaveAll}
            className="min-h-[52px] flex-1 border-2 border-slate-900 bg-slate-900 text-sm font-bold text-white disabled:opacity-40"
          >
            すべて保存（{totalShots}枚）
          </button>
          <button
            type="button"
            disabled={!totalShots}
            onClick={onOpenShareSheet}
            className="min-h-[52px] flex-1 border-2 border-slate-900 bg-before text-sm font-bold text-white disabled:opacity-40"
          >
            共有する（{totalShots}枚）
          </button>
        </div>
      </div>
    </div>
  );
}
