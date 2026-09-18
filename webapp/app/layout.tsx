import type { Metadata, Viewport } from 'next';
import './globals.css';
import SWRegister from '@/components/SWRegister';

export const metadata: Metadata = {
  title: '現場ビフォーアフター',
  description: '作業前・作業後の写真を番号ごとに撮影・整理するオフライン対応アプリ',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-white text-slate-900">
        <SWRegister />
        <div className="mx-auto min-h-screen w-full max-w-md bg-white">{children}</div>
      </body>
    </html>
  );
}
