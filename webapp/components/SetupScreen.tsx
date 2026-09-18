'use client';

import { useState } from 'react';

const PRESETS = [5, 10, 20, 30, 50, 100];

export default function SetupScreen({ onStart }: { onStart: (count: number) => void }) {
  const [count, setCount] = useState(10);

  function clamp(n: number): number {
    if (Number.isNaN(n)) return 1;
    return Math.min(999, Math.max(1, Math.round(n)));
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-5 py-10">
      <h1 className="text-center text-2xl font-bold text-slate-900">現場ビフォーアフター</h1>
      <p className="mt-2 text-center text-sm text-slate-500">
        作業前・作業後の写真を番号ごとに撮影・整理します
      </p>

      <div className="mt-10 border-2 border-slate-900 bg-white p-4">
        <div className="text-sm font-bold text-slate-900">箇所数を選ぶ</div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setCount(p)}
              className={`min-h-[48px] border-2 border-slate-900 text-base font-bold ${
                count === p ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            aria-label="減らす"
            onClick={() => setCount((c) => clamp(c - 1))}
            className="min-h-[48px] min-w-[48px] border-2 border-slate-900 bg-white text-xl font-bold text-slate-900"
          >
            −
          </button>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={999}
            value={count}
            onChange={(e) => setCount(clamp(Number(e.target.value)))}
            className="min-h-[48px] flex-1 border-2 border-slate-900 text-center text-lg font-bold text-slate-900"
          />
          <button
            type="button"
            aria-label="増やす"
            onClick={() => setCount((c) => clamp(c + 1))}
            className="min-h-[48px] min-w-[48px] border-2 border-slate-900 bg-white text-xl font-bold text-slate-900"
          >
            ＋
          </button>
        </div>

        <button
          type="button"
          onClick={() => onStart(count)}
          className="mt-5 min-h-[52px] w-full border-2 border-slate-900 bg-before text-lg font-bold text-white"
        >
          {count}箇所ではじめる
        </button>
      </div>

      <div className="mt-6 text-center text-xs leading-relaxed text-slate-400">
        データはこの端末に自動保存されます
        <br />
        後から箇所追加もできます
      </div>
    </div>
  );
}
