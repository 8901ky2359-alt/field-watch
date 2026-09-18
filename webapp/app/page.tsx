'use client';

import { useEffect, useRef, useState } from 'react';
import { clearProject, loadProject, loadQuality, saveProject, saveQuality } from '@/lib/db';
import { fileToDataUrl5x4 } from '@/lib/image';
import { buildShareText, fileNameFor, shareFiles } from '@/lib/share';
import {
  createCloudProject,
  deleteCloudShot,
  fetchCloudProject,
  patchCloudProject,
  uploadCloudShot,
  urlToFile,
} from '@/lib/cloud';
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
  const [quality, setQuality] = useState<Quality>('high');
  const [cameraTarget, setCameraTarget] = useState<{ index: number; side: Side } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [busySlots, setBusySlots] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const nameDebounce = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      setQuality(loadQuality());
      const params = new URLSearchParams(window.location.search);
      const sharedId = params.get('p');

      if (sharedId) {
        try {
          const cloud = await fetchCloudProject(sharedId);
          setProject(cloud);
          await saveProject(cloud);
        } catch {
          notify('共有プロジェクトの読み込みに失敗しました');
          setProject(await loadProject());
        }
        setReady(true);
        return;
      }

      const local = await loadProject();
      if (local?.id) {
        try {
          setProject(await fetchCloudProject(local.id));
        } catch {
          setProject(local); // offline: fall back to the last synced local copy
        }
      } else {
        setProject(local);
      }
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || !project) return;
    saveProject(project).catch(() => {});
  }, [project, ready]);

  // Pull teammates' updates when the tab regains focus.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === 'visible') refreshFromCloud();
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

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

  async function refreshFromCloud() {
    if (!project?.id) return;
    try {
      const cloud = await fetchCloudProject(project.id);
      setProject((prev) => (prev ? { ...cloud, name: cloud.name } : cloud));
    } catch {
      // offline or unreachable: keep whatever is currently shown
    }
  }

  async function handleStart(count: number) {
    try {
      const cloud = await createCloudProject(count);
      setProject(cloud);
      const url = new URL(window.location.href);
      url.searchParams.set('p', cloud.id as string);
      window.history.replaceState(null, '', url.toString());
      notify('現場を作成しました。右上の「共有」からリンクを送れます');
    } catch {
      setProject(makeProject(count));
      notify('オフラインのためこの端末だけに保存します');
    }
  }

  async function handleNew() {
    await clearProject();
    setProject(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('p');
    window.history.replaceState(null, '', url.toString());
  }

  async function syncShot(index: number, side: Side, dataUrl: string) {
    const id = project?.id;
    if (!id) return;
    try {
      const file = await urlToFile(dataUrl, `${index}-${side}.jpg`);
      const updated = await uploadCloudShot(id, index, side, file);
      setProject((prev) => (prev ? { ...updated, name: prev.name } : updated));
    } catch {
      notify('クラウド同期に失敗しました（この端末には保存済みです）');
    }
  }

  async function handleCameraConfirm(dataUrl: string) {
    if (!cameraTarget) return;
    const { index, side } = cameraTarget;
    setSlot(index, side, dataUrl);
    setCameraTarget(null);
    markBusy(index, side, true);
    try {
      await syncShot(index, side, dataUrl);
      notify('写真を保存しました');
    } finally {
      markBusy(index, side, false);
    }
  }

  async function handlePickFile(index: number, side: Side, file: File) {
    markBusy(index, side, true);
    try {
      const dataUrl = await fileToDataUrl5x4(file, quality);
      setSlot(index, side, dataUrl);
      await syncShot(index, side, dataUrl);
      notify('写真を保存しました');
    } catch {
      notify('画像の読み込みに失敗しました');
    } finally {
      markBusy(index, side, false);
    }
  }

  async function handleDeletePhoto(index: number, side: Side) {
    setSlot(index, side, null);
    const id = project?.id;
    if (!id) return;
    try {
      const updated = await deleteCloudShot(id, index, side);
      setProject((prev) => (prev ? { ...updated, name: prev.name } : updated));
    } catch {
      notify('クラウド同期に失敗しました');
    }
  }

  function handleNameChange(name: string) {
    setProject((prev) => (prev ? { ...prev, name } : prev));
    const id = project?.id;
    if (!id) return;
    if (nameDebounce.current) window.clearTimeout(nameDebounce.current);
    nameDebounce.current = window.setTimeout(() => {
      patchCloudProject(id, { name }).catch(() => notify('クラウド同期に失敗しました'));
    }, 600);
  }

  async function handleAddSlots(n: number) {
    const id = project?.id;
    const newCount = (project?.count ?? 0) + n;
    setProject((prev) => {
      if (!prev) return prev;
      const items = prev.items.concat(Array.from({ length: n }, emptyItem));
      return { ...prev, items, count: prev.count + n, updatedAt: Date.now() };
    });
    if (!id) return;
    try {
      await patchCloudProject(id, { count: newCount });
    } catch {
      notify('クラウド同期に失敗しました');
    }
  }

  async function handleSaveOne(index: number, side: Side) {
    if (!project) return;
    const shot = project.items[index - 1][side];
    if (!shot) return;
    const file = await urlToFile(shot.dataUrl, fileNameFor(project, index, side));
    const result = await shareFiles([file], buildShareText([index]));
    notify(result === 'downloaded' ? '保存しました' : '共有しました');
  }

  async function handleSaveAll() {
    if (!project) return;
    const files: File[] = [];
    const numbers: number[] = [];
    for (let i = 0; i < project.items.length; i++) {
      const item = project.items[i];
      const index = i + 1;
      if (item.before) files.push(await urlToFile(item.before.dataUrl, fileNameFor(project, index, 'before')));
      if (item.after) files.push(await urlToFile(item.after.dataUrl, fileNameFor(project, index, 'after')));
      if (item.before || item.after) numbers.push(index);
    }
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

  const shareUrl = project.id
    ? `${window.location.origin}${window.location.pathname}?p=${project.id}`
    : null;

  return (
    <div className="relative min-h-screen">
      <WorkScreen
        project={project}
        shareUrl={shareUrl}
        onNameChange={handleNameChange}
        onNew={handleNew}
        onRefresh={refreshFromCloud}
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
