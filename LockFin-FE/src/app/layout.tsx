import type { Metadata, Viewport } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { Providers } from './providers';
import { ToastViewport } from '@/components/ui/Toast';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-sans', display: 'swap' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin', 'vietnamese'], variable: '--font-display', display: 'swap' });

export const metadata: Metadata = {
  title: 'LockFin — chụp chi tiêu, giữ streak 🔥',
  description: 'Theo dõi chi tiêu cá nhân theo phong cách Locket — chụp ảnh, chia sẻ, giữ streak.',
  manifest: '/manifest.json',
  applicationName: 'LockFin',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'LockFin' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FF6B6B' },
    { media: '(prefers-color-scheme: dark)', color: '#0B0C11' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

/**
 * No-FOUC: set data-theme trước khi paint để tránh nháy sáng→tối.
 * Ưu tiên lựa chọn đã lưu, nếu chưa có thì theo cài đặt hệ thống.
 */
const themeScript = `(function(){try{var t=localStorage.getItem('lockfin-theme');if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
        <ToastViewport />
      </body>
    </html>
  );
}
