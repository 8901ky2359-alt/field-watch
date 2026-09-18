'use client';

import { useEffect } from 'react';

export default function SWRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // offline support is a progressive enhancement; ignore registration failures
      });
    });
  }, []);
  return null;
}
