import type { Project } from './types';

const DB_NAME = 'ba-photos';
const DB_VERSION = 1;
const STORE = 'project';
const CURRENT_KEY = 'current';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadProject(): Promise<Project | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(CURRENT_KEY);
    req.onsuccess = () => resolve((req.result as Project) ?? null);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function saveProject(project: Project): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(project, CURRENT_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearProject(): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(CURRENT_KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export function loadQuality(): 'standard' | 'high' {
  if (typeof window === 'undefined') return 'standard';
  const v = window.localStorage.getItem('ba-quality');
  return v === 'high' ? 'high' : 'standard';
}

export function saveQuality(q: 'standard' | 'high'): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('ba-quality', q);
}
