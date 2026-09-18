'use client';

import { useEffect, useRef, useState } from 'react';
import { clearProject, loadProject, loadQuality, saveProject, saveQuality } from '@/lib/db';
import { dataUrlToFile, fileToDataUrl5x4 } from '@/lib/image';
import { buildShareText, fileNameFor, shareFiles } from '@/lib/share';
import { emptyItem, makeProject } from '@/lib/types';
import type { Project, Quality } from '@/lib/types';
import SetupScreen from '@/components/SetupScreen';
import WorkScreen from '@/components/WorkScreen';
import CameraModal from '@/components/CameraModal';
import ShareSheet from '@/components/ShareSheet';

type Side = 'before' | 'after';

export default function Home() {
  const [ready, setReady] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [quality, setQuality] = useState<Quality>('standard');
  const [cameraTarget, setCameraTarget] = useState<{ index: number; side: Side } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [busySlots, setBusySlots] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      setQuality(loadQuality());
      const p = await loadProject();
      setProject(p);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!ready || !project) return;
    saveProject(project).catch(() => {});
  }, [project, ready]);

  function notify(msg: string) {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }

  function updateQuality(q: Quality) {
    setQuality(q);
    saveQuality(q);
  }

  function setSlot(index: number, side: Side, dataUrl: string | null) {
    setProject((prev) => {
      if (!prev) return prev;
      const items = prev.items.slice();
      const item = { ...items[index - 1] };
      item[side] = dataUrl ? { dataUrl } : null;
      items[index - 1] = item;
      return { ...prev, items, updatedAt: Date.now() };
    });
  }

  function markBusy(index: number, side: Side, busy: boolean) {
    setBusySlots((prev) => {
      const next = new Set(prev);
      const k = `${index}-${side}`;
      if (busy) next.add(k);
      else next.delete(k);
      return next;
    });
  }

  async function handleStart(count: number) {
    const p = makeProject(count);
    setProject(p);
  }

  async function handleNew() {
    await clearProject();
    setProject(null);
  }

  function handleCameraConfirm(dataUrl: string) {
    if (!cameraTarget) return;
    setSlot(cameraTarget.index, cameraTarget.side, dataUrl);
    setCameraTarget(null);
    notify('写真を保存しました');
  }

  async function handlePickFile(index: number, side: Side, file: File) {
    markBusy(index, side, true);
    try {
      const dataUrl = await fileToDataUrl5x4(file, quality);
      setSlot(index, side, dataUrl);
      notify('写真を保存しました');
    } catch {
      notify('画像の読み込みに失敗しました');
    } finally {
      markBusy(index, side, false);
    }
  }

  function handleDeletePhoto(index: number, side: Side) {
    setSlot(index, side, null);
  }

  async function handleSaveOne(index: number, side: Side) {
    if (!project) return;
    const shot = project.items[index - 1][side];
    if (!shot) return;
    const file = dataUrlToFile(shot.dataUrl, fileNameFor(project, index, side));
    const result = await shareFiles([file], buildShareText([index]));
    notify(result === 'downloaded' ? '保存しました' : '共有しました');
  }

  function handleAddSlots(n: number) {
    setProject((prev) => {
      if (!prev) return prev;
      const items = prev.items.concat(Array.from({ length: n }, emptyItem));
      return { ...prev, items, count: prev.count + n, updatedAt: Date.now() };
    });
  }

  async function handleSaveAll() {
    if (!project) return;
    const files: File[] = [];
    const numbers: number[] = [];
    project.items.forEach((item, i) => {
      const index = i + 1;
      if (item.before) files.push(dataUrlToFile(item.before.dataUrl, fileNameFor(project, index, 'before')));
      if (item.after) files.push(dataUrlToFile(item.after.dataUrl, fileNameFor(project, index, 'after')));
      if (item.before || item.after) numbers.push(index);
    });
    if (!files.length) return;
    const result = await shareFiles(files, buildShareText(numbers));
    notify(result === 'downloaded' ? `${files.length}枚をダウンロードしました` : `${files.length}枚を共有しました`);
  }

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">読み込み中…</div>;
  }

  if (!project) {
    return <SetupScreen onStart={handleStart} />;
  }

  return (
    <div className="relative min-h-screen">
      <WorkScreen
        project={project}
        onNameChange={(name) => setProject((prev) => (prev ? { ...prev, name } : prev))}
        onNew={handleNew}
        onCapture={(index, side) => setCameraTarget({ index, side })}
        onPickFile={handlePickFile}
        onDeletePhoto={handleDeletePhoto}
        onSaveOne={handleSaveOne}
        onAddSlots={handleAddSlots}
        onSaveAll={handleSaveAll}
        onOpenShareSheet={() => setShareOpen(true)}
        busySlots={busySlots}
      />

      {cameraTarget && (
        <CameraModal
          quality={quality}
          onQualityChange={updateQuality}
          onClose={() => setCameraTarget(null)}
          onConfirm={handleCameraConfirm}
        />
      )}

      {shareOpen && <ShareSheet project={project} onClose={() => setShareOpen(false)} />}

      {toast && (
        <div className="pointer-events-none fixed bottom-28 left-1/2 z-50 -translate-x-1/2 border-2 border-slate-900 bg-slate-900 px-4 py-2 text-xs font-bold text-white">
          {toast}
        </div>
      )}
    </div>
  );
}
