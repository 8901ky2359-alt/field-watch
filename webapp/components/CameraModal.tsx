'use client';

import { useEffect, useRef, useState } from 'react';
import type { Quality } from '@/lib/types';
import { captureVideoFrame, fileToDataUrl5x4, getVideoConstraints } from '@/lib/image';

type FocusPoint = { x: number; y: number } | null;

export default function CameraModal({
  quality,
  onQualityChange,
  onClose,
  onConfirm,
}: {
  quality: Quality;
  onQualityChange: (q: Quality) => void;
  onClose: () => void;
  onConfirm: (dataUrl: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'starting' | 'live' | 'review' | 'fallback' | 'error'>('starting');
  const [captured, setCaptured] = useState<string | null>(null);
  const [shutterSound, setShutterSound] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [focusPoint, setFocusPoint] = useState<FocusPoint>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) setMode('fallback');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia(getVideoConstraints(quality));
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          const video = videoRef.current;
          video.srcObject = stream;
          await video.play().catch(() => {});
          // videoWidth/videoHeight aren't guaranteed to be populated the
          // instant play() resolves; wait for them so a shutter tap can
          // never try to capture a 0x0 frame.
          if (!video.videoWidth) {
            await new Promise<void>((resolve) => {
              const onLoaded = () => {
                video.removeEventListener('loadedmetadata', onLoaded);
                resolve();
              };
              video.addEventListener('loadedmetadata', onLoaded);
              window.setTimeout(resolve, 1500);
            });
          }
        }
        if (cancelled) return;
        const track = stream.getVideoTracks()[0];
        const caps = track?.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;
        setTorchSupported(!!caps?.torch);
        setMode('live');
      } catch {
        if (!cancelled) setMode('fallback');
      }
    }

    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // best-effort: re-apply resolution constraints when quality changes mid-session
  useEffect(() => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const c = getVideoConstraints(quality).video;
    if (typeof c === 'object') {
      track.applyConstraints(c).catch(() => {});
    }
  }, [quality]);

  function playShutterSound() {
    if (!shutterSound) return;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const now = ctx.currentTime;

      // a quick mechanical "tick" so it still reads as a shutter…
      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      click.type = 'square';
      click.frequency.value = 2200;
      clickGain.gain.setValueAtTime(0.12, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      click.connect(clickGain).connect(ctx.destination);
      click.start(now);
      click.stop(now + 0.03);

      // …followed by a playful little coin-chime flourish
      const notes = [
        { freq: 988, start: 0.04, dur: 0.09 }, // B5
        { freq: 1319, start: 0.11, dur: 0.2 }, // E6
      ];
      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now + start);
        gain.gain.exponentialRampToValueAtTime(0.18, now + start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + start);
        osc.stop(now + start + dur + 0.02);
      });

      window.setTimeout(() => ctx.close().catch(() => {}), 450);
    } catch {
      // audio feedback is optional
    }
  }

  function handleTapFocus(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setFocusPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    window.setTimeout(() => setFocusPoint(null), 600);

    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const caps = track.getCapabilities?.() as (MediaTrackCapabilities & { focusMode?: string[] }) | undefined;
    if (caps?.focusMode?.includes('single-shot')) {
      const advanced: (MediaTrackConstraintSet & {
        focusMode?: string;
        pointsOfInterest?: { x: number; y: number }[];
      })[] = [{ focusMode: 'single-shot', pointsOfInterest: [{ x, y }] }];
      track.applyConstraints({ advanced } as MediaTrackConstraints).catch(() => {});
    }
  }

  async function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as unknown as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch {
      // torch not actually controllable despite capability flag; ignore
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    playShutterSound();
    const dataUrl = captureVideoFrame(video, quality);
    setCaptured(dataUrl);
    setMode('review');
  }

  function retake() {
    setCaptured(null);
    setMode('live');
  }

  function useShot() {
    if (captured) onConfirm(captured);
  }

  async function handleFallbackFile(file: File) {
    try {
      const dataUrl = await fileToDataUrl5x4(file, quality);
      onConfirm(dataUrl);
    } catch {
      setMode('error');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/*
        Always mounted (just hidden outside live/review) so videoRef is
        attached to a real DOM node before getUserMedia resolves — the
        stream used to be assigned to a ref that didn't exist yet because
        this block only rendered once `mode` became 'live'. Pinned near the
        top so the viewfinder stays visible while the thumb works down in
        the control zone below.
      */}
      <div className="flex justify-center px-3 pt-3">
        <div
          className={`relative w-full max-w-md overflow-hidden border-2 border-white ${
            mode === 'live' || mode === 'review' ? '' : 'hidden'
          }`}
          style={{ aspectRatio: '5 / 4' }}
          onClick={mode === 'live' ? handleTapFocus : undefined}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            className={`h-full w-full object-cover ${mode === 'review' ? 'hidden' : ''}`}
          />
          {mode === 'review' && captured && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={captured} alt="撮影結果" className="h-full w-full object-cover" />
          )}
          {focusPoint && (
            <div
              className="pointer-events-none absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 border-2 border-yellow-300"
              style={{ left: focusPoint.x, top: focusPoint.y }}
            />
          )}
          {mode === 'live' && (
            <button
              type="button"
              onClick={() => onQualityChange(quality === 'high' ? 'standard' : 'high')}
              className="absolute right-2 top-2 min-h-[32px] border-2 border-white bg-black/50 px-2 text-xs font-bold text-white"
            >
              {quality === 'high' ? '高画質' : '標準'}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-3">
        {mode === 'starting' && <div className="text-sm text-white">カメラを起動しています…</div>}

        {mode === 'error' && <div className="text-sm text-white">画像の読み込みに失敗しました</div>}

        {mode === 'fallback' && (
          <div className="flex flex-col items-center gap-4 text-center text-white">
            <div className="text-sm">
              カメラを利用できないため、
              <br />
              標準カメラ／アルバムで撮影します
            </div>
            <button
              type="button"
              onClick={() => fallbackInputRef.current?.click()}
              className="min-h-[52px] border-2 border-white bg-white px-6 text-base font-bold text-black"
            >
              標準カメラ／アルバムで撮る
            </button>
            <input
              ref={fallbackInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file) handleFallbackFile(file);
              }}
            />
          </div>
        )}
      </div>

      {/* every control lives down here, within thumb reach when holding the phone one-handed */}
      <div className="border-t-2 border-white/20 p-4">
        {mode === 'live' && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShutterSound((v) => !v)}
                className={`min-h-[48px] min-w-[48px] border-2 border-white px-3 text-xs font-bold ${
                  shutterSound ? 'bg-white text-black' : 'text-white'
                }`}
              >
                音{shutterSound ? 'ON' : 'OFF'}
              </button>
              {torchSupported && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`min-h-[48px] min-w-[48px] border-2 border-white px-3 text-xs font-bold ${
                    torchOn ? 'bg-white text-black' : 'text-white'
                  }`}
                >
                  ライト{torchOn ? 'ON' : 'OFF'}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="min-h-[48px] min-w-[48px] border-2 border-white px-3 text-xs font-bold text-white"
              >
                閉じる
              </button>
            </div>
            <button
              type="button"
              onClick={capture}
              className="flex min-h-[72px] min-w-[72px] shrink-0 items-center justify-center border-4 border-white bg-white/10"
              aria-label="シャッター"
            >
              <span className="block h-12 w-12 bg-white" />
            </button>
          </div>
        )}

        {(mode === 'starting' || mode === 'fallback' || mode === 'error') && (
          <button
            type="button"
            onClick={onClose}
            className="min-h-[52px] w-full border-2 border-white text-base font-bold text-white"
          >
            閉じる
          </button>
        )}
        {mode === 'review' && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={retake}
              className="min-h-[52px] flex-1 border-2 border-white text-base font-bold text-white"
            >
              撮り直す
            </button>
            <button
              type="button"
              onClick={useShot}
              className="min-h-[52px] flex-1 border-2 border-white bg-white text-base font-bold text-black"
            >
              この写真を使う
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
