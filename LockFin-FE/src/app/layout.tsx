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
  themeColor: '#FF6B6B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${inter.variable} ${jakarta.variable}`}>
      <body>
        <Providers>{children}</Providers>
        <ToastViewport />
      </body>
    </html>
  );
}
