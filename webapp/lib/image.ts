import type { Quality } from './types';

const TARGET_RATIO = 5 / 4; // width / height (landscape)

export const QUALITY_PARAMS: Record<
  Quality,
  { captureWidth: number; captureHeight: number; maxWidth: number; jpegQuality: number }
> = {
  high: { captureWidth: 3840, captureHeight: 2160, maxWidth: 2560, jpegQuality: 0.92 },
  standard: { captureWidth: 1920, captureHeight: 1440, maxWidth: 1600, jpegQuality: 0.85 },
};

export function getVideoConstraints(quality: Quality): MediaStreamConstraints {
  const p = QUALITY_PARAMS[quality];
  return {
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: p.captureWidth },
      height: { ideal: p.captureHeight },
    },
    audio: false,
  };
}

function computeCropRect(srcW: number, srcH: number, targetRatio: number) {
  const srcRatio = srcW / srcH;
  let cropW = srcW;
  let cropH = srcH;
  if (srcRatio > targetRatio) {
    cropW = srcH * targetRatio;
  } else {
    cropH = srcW / targetRatio;
  }
  const sx = (srcW - cropW) / 2;
  const sy = (srcH - cropH) / 2;
  return { sx, sy, sw: cropW, sh: cropH };
}

function drawSourceTo5x4Canvas(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  quality: Quality
): HTMLCanvasElement {
  if (!srcW || !srcH) throw new Error('invalid source dimensions');
  const { sx, sy, sw, sh } = computeCropRect(srcW, srcH, TARGET_RATIO);
  const p = QUALITY_PARAMS[quality];
  const outW = Math.max(1, Math.min(p.maxWidth, Math.round(sw)));
  const outH = Math.max(1, Math.round(outW / TARGET_RATIO));
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, outW, outH);
  return canvas;
}

export function captureVideoFrame(video: HTMLVideoElement, quality: Quality): string {
  const canvas = drawSourceTo5x4Canvas(video, video.videoWidth, video.videoHeight, quality);
  return canvas.toDataURL('image/jpeg', QUALITY_PARAMS[quality].jpegQuality);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}

export function fileToDataUrl5x4(file: File, quality: Quality): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = drawSourceTo5x4Canvas(img, img.naturalWidth, img.naturalHeight, quality);
        resolve(canvas.toDataURL('image/jpeg', QUALITY_PARAMS[quality].jpegQuality));
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image load failed'));
    };
    img.src = url;
  });
}

export async function buildCompareImage(
  beforeDataUrl: string,
  afterDataUrl: string,
  heading: string
): Promise<string> {
  const [beforeImg, afterImg] = await Promise.all([loadImage(beforeDataUrl), loadImage(afterDataUrl)]);
  const cellW = 800;
  const cellH = Math.round(cellW / TARGET_RATIO);
  const headingH = 56;
  const labelH = 32;
  const gap = 4;

  const canvas = document.createElement('canvas');
  canvas.width = cellW * 2 + gap;
  canvas.height = headingH + labelH + cellH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(heading, canvas.width / 2, headingH / 2, canvas.width - 16);

  ctx.fillStyle = '#2563eb';
  ctx.fillRect(0, headingH, cellW, labelH);
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(cellW + gap, headingH, cellW, labelH);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('BEFORE', cellW / 2, headingH + labelH / 2);
  ctx.fillText('AFTER', cellW + gap + cellW / 2, headingH + labelH / 2);

  ctx.drawImage(beforeImg, 0, headingH + labelH, cellW, cellH);
  ctx.drawImage(afterImg, cellW + gap, headingH + labelH, cellW, cellH);

  return canvas.toDataURL('image/jpeg', 0.85);
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(',');
  const mimeMatch = meta.match(/data:(.*?);base64/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
  return new File([dataUrlToBlob(dataUrl)], filename, { type: 'image/jpeg' });
}
