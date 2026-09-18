import type { Project } from './types';

function sanitize(s: string): string {
  return s.replace(/[\\/:*?"<>|]/g, '_');
}

export function fileNameFor(project: Project, index: number, kind: 'before' | 'after' | 'compare'): string {
  const prefix = project.name.trim() ? `${sanitize(project.name.trim())}_` : '';
  const suffix = kind === 'before' ? 'before' : kind === 'after' ? 'after' : '比較';
  return `${prefix}${index}_${suffix}.jpg`;
}

export function buildShareText(numbers: number[]): string {
  return numbers.map((n) => `${n}番`).join(' ');
}

export type ShareResult = 'shared' | 'downloaded' | 'cancelled';

export async function shareFiles(files: File[], text: string): Promise<ShareResult> {
  if (!files.length) return 'downloaded';

  const nav = navigator as Navigator & {
    share?: (data: ShareData) => Promise<void>;
    canShare?: (data: ShareData) => boolean;
  };

  if (nav.share && nav.canShare && nav.canShare({ files })) {
    try {
      await nav.share({ files, text });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
      // fall through to the download fallback below
    }
  }

  downloadFiles(files);
  return 'downloaded';
}

function downloadFiles(files: File[]): void {
  files.forEach((file, i) => {
    window.setTimeout(() => {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    }, i * 150);
  });
}
