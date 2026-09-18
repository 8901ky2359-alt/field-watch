import type { Item, Project } from './types';
import { dataUrlToFile } from './image';

type CloudItem = {
  before: { objectKey: string } | null;
  after: { objectKey: string } | null;
};

type CloudProject = {
  id: string;
  name: string;
  count: number;
  items: CloudItem[];
  updatedAt: string;
};

export function imageUrl(objectKey: string): string {
  return `/api/image?key=${encodeURIComponent(objectKey)}`;
}

function cloudToProject(cp: CloudProject): Project {
  const items: Item[] = cp.items.map((it) => ({
    before: it.before ? { dataUrl: imageUrl(it.before.objectKey) } : null,
    after: it.after ? { dataUrl: imageUrl(it.after.objectKey) } : null,
  }));
  return { id: cp.id, name: cp.name, count: cp.count, items, updatedAt: Date.now() };
}

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `request failed (${res.status})`);
  return data as T;
}

export async function createCloudProject(count: number, name = ''): Promise<Project> {
  const data = await apiJson<{ project: CloudProject }>('/api/projects', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ count, name }),
  });
  return cloudToProject(data.project);
}

export async function fetchCloudProject(id: string): Promise<Project> {
  const data = await apiJson<{ project: CloudProject }>(`/api/projects/${id}`);
  return cloudToProject(data.project);
}

export async function patchCloudProject(id: string, patch: { name?: string; count?: number }): Promise<Project> {
  const data = await apiJson<{ project: CloudProject }>(`/api/projects/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return cloudToProject(data.project);
}

export async function uploadCloudShot(
  id: string,
  idx: number,
  side: 'before' | 'after',
  file: File
): Promise<Project> {
  const form = new FormData();
  form.append('idx', String(idx));
  form.append('side', side);
  form.append('file', file);
  const data = await apiJson<{ project: CloudProject }>(`/api/projects/${id}/shots`, {
    method: 'POST',
    body: form,
  });
  return cloudToProject(data.project);
}

export async function deleteCloudShot(id: string, idx: number, side: 'before' | 'after'): Promise<Project> {
  const data = await apiJson<{ project: CloudProject }>(
    `/api/projects/${id}/shots?idx=${idx}&side=${side}`,
    { method: 'DELETE' }
  );
  return cloudToProject(data.project);
}

// A shot's `dataUrl` may be either a local data: URI (just captured on this
// device) or a same-origin /api/image?key=... URL (synced from the cloud,
// possibly captured by someone else). Both work directly as an <img src>,
// but turning one into a shareable/downloadable File needs to know which.
export async function urlToFile(url: string, filename: string): Promise<File> {
  if (url.startsWith('data:')) return dataUrlToFile(url, filename);
  const res = await fetch(url);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}
