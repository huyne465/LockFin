'use client';

import { usePathname } from 'next/navigation';

/**
 * Khung chuyển trang. `template` (khác `layout`) tự re-mount toàn bộ con của nó
 * sau mỗi lần điều hướng, nên CSS animation `.page-enter` được phát lại cho từng
 * trang — tạo hiệu ứng chuyển mượt mà không đụng tới `<main>` (vùng cuộn) và
 * `BottomNav` vốn nằm ở layout, giữ nguyên không nhấp nháy.
 *
 * `key={pathname}` đảm bảo node mới hoàn toàn khi đổi route → animation chạy lại
 * sạch sẽ. Hiệu ứng tự tôn trọng `prefers-reduced-motion` qua rule reduced-motion
 * toàn cục trong globals.css.
 *
 * NGOẠI LỆ trang Chụp ('/'): nó render <video> từ getUserMedia. Trong PWA
 * standalone trên WebKit, <video> nằm trong phần tử có CSS `transform` (kể cả
 * transform động của `.page-enter`) sẽ không vẽ được lớp video → màn hình đen dù
 * đã cấp quyền. Vì vậy route này KHÔNG bọc wrapper transform — render thẳng.
 */
export default function MainTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/') return <>{children}</>;
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
