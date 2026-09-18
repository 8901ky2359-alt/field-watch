'use client';

import { useMemo, useState } from 'react';
import type { Project } from '@/lib/types';
import { buildCompareImage, dataUrlToFile } from '@/lib/image';
import { buildShareText, fileNameFor, shareFiles } from '@/lib/share';

type Key = string; // `${index}-${side}`

function keyOf(index: number, side: 'before' | 'after'): Key {
  return `${index}-${side}`;
}

export default function ShareSheet({ project, onClose }: { project: Project; onClose: () => void }) {
  const shots = useMemo(() => {
    const list: { index: number; side: 'before' | 'after'; dataUrl: string }[] = [];
    project.items.forEach((item, i) => {
      const index = i + 1;
      if (item.before) list.push({ index, side: 'before', dataUrl: item.before.dataUrl });
      if (item.after) list.push({ index, side: 'after', dataUrl: item.after.dataUrl });
    });
    return list;
  }, [project.items]);

  const pairIndexes = useMemo(
    () => project.items.map((it, i) => (it.before && it.after ? i + 1 : null)).filter((n): n is number => n !== null),
    [project.items]
  );

  const [selected, setSelected] = useState<Set<Key>>(() => new Set(shots.map((s) => keyOf(s.index, s.side))));
  const [busyMsg, setBusyMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  function toggle(index: number, side: 'before' | 'after') {
    setSelected((prev) => {
      const next = new Set(prev);
      const k = keyOf(index, side);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(shots.map((s) => keyOf(s.index, s.side))));
  }
  function selectPairsOnly() {
    setSelected(new Set(pairIndexes.flatMap((n) => [keyOf(n, 'before'), keyOf(n, 'after')])));
  }
  function clearSelection() {
    setSelected(new Set());
  }

  function notify(msg: string) {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2200);
  }

  async function shareSelected() {
    const targets = shots.filter((s) => selected.has(keyOf(s.index, s.side)));
    if (!targets.length) return;
    setBusyMsg('共有の準備をしています…');
    try {
      const files = targets.map((t) => dataUrlToFile(t.dataUrl, fileNameFor(project, t.index, t.side)));
      const text = buildShareText(Array.from(new Set(targets.map((t) => t.index))).sort((a, b) => a - b));
      const result = await shareFiles(files, text);
      notify(result === 'downloaded' ? `${files.length}枚をダウンロードしました` : `${files.length}枚を共有しました`);
    } finally {
      setBusyMsg(null);
    }
  }

  async function shareComparisons() {
    if (!pairIndexes.length) {
      notify('Before/Afterが揃った箇所がありません');
      return;
    }
    setBusyMsg('比較画像を作成しています…');
    try {
      const files: File[] = [];
      for (const n of pairIndexes) {
        const item = project.items[n - 1];
        if (!item.before || !item.after) continue;
        const heading = `${project.name ? project.name + ' ' : ''}${n}番`;
        const compareDataUrl = await buildCompareImage(item.before.dataUrl, item.after.dataUrl, heading);
        files.push(dataUrlToFile(compareDataUrl, fileNameFor(project, n, 'compare')));
      }
      const text = buildShareText(pairIndexes);
      const result = await shareFiles(files, text);
      notify(result === 'downloaded' ? `比較画像${files.length}枚をダウンロードしました` : `比較画像${files.length}枚を共有しました`);
    } finally {
      setBusyMsg(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b-2 border-slate-900 px-4 py-3">
        <div className="text-base font-bold text-slate-900">共有する</div>
        <button type="button" onClick={onClose} className="min-h-[40px] px-2 text-sm font-bold text-slate-900">
          閉じる
        </button>
      </div>

      <div className="flex gap-2 border-b-2 border-slate-900 px-4 py-3">
        <button type="button" onClick={selectAll} className="min-h-[40px] flex-1 border-2 border-slate-900 text-xs font-bold">
          すべて
        </button>
        <button
          type="button"
          onClick={selectPairsOnly}
          className="min-h-[40px] flex-1 border-2 border-slate-900 text-xs font-bold"
        >
          完了ペアのみ
        </button>
        <button type="button" onClick={clearSelection} className="min-h-[40px] flex-1 border-2 border-slate-900 text-xs font-bold">
          クリア
        </button>
      </div>

      <div className="px-4 py-2 text-sm font-bold text-slate-600">選択中：{selected.size}枚</div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {shots.length === 0 ? (
          <div className="mt-10 text-center text-sm text-slate-400">まだ写真がありません</div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {shots.map((s) => {
              const k = keyOf(s.index, s.side);
              const isSelected = selected.has(k);
              const isBefore = s.side === 'before';
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggle(s.index, s.side)}
                  className={`relative border-2 ${isBefore ? 'border-before' : 'border-after'} ${
                    isSelected ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.dataUrl} alt="" className="aspect-[5/4] w-full object-cover" />
                  <span
                    className={`absolute left-1 top-1 px-1.5 py-0.5 text-[10px] font-bold text-white ${
                      isBefore ? 'bg-before' : 'bg-after'
                    }`}
                  >
                    {s.index}
                    {isBefore ? 'B' : 'A'}
                  </span>
                  {isSelected && (
                    <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center border-2 border-slate-900 bg-white text-xs font-bold">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t-2 border-slate-900 p-4">
        <button
          type="button"
          disabled={!selected.size || !!busyMsg}
          onClick={shareSelected}
          className="min-h-[52px] w-full border-2 border-slate-900 bg-before text-base font-bold text-white disabled:opacity-40"
        >
          選んだ写真を共有（{selected.size}枚）
        </button>
        <button
          type="button"
          disabled={!pairIndexes.length || !!busyMsg}
          onClick={shareComparisons}
          className="mt-2 min-h-[52px] w-full border-2 border-slate-900 bg-after text-base font-bold text-white disabled:opacity-40"
        >
          比較画像にまとめて共有（{pairIndexes.length}ペア）
        </button>
        {busyMsg && <div className="mt-2 text-center text-xs font-bold text-slate-500">{busyMsg}</div>}
      </div>

      {toastMsg && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 border-2 border-slate-900 bg-slate-900 px-4 py-2 text-xs font-bold text-white">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
