'use client';

import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';

interface SmoothImageProps {
  src?: string | null;
  alt?: string;
  /** Wrapper — truyền kích thước + bo góc (vd: "h-full w-full", "aspect-square rounded-xl"). */
  className?: string;
  /** Áp cho thẻ <img> — mặc định object-cover. */
  imgClassName?: string;
  /** Màu nền skeleton — đổi sang "bg-white/10" cho nền tối (lightbox). */
  skeletonClassName?: string;
  /** Hiện khi không có src. */
  fallback?: React.ReactNode;
}

/**
 * Ảnh có skeleton: hiện nền pulse tới khi ảnh tải xong rồi fade-in — tránh "giật"
 * pop-in mỗi lần component mount / re-render (đổi tháng, mở lightbox, mở picker…).
 * Tự xử lý ảnh đã cache (trình duyệt có thể không bắn `onLoad` lại) bằng cách kiểm
 * tra `complete`, nên ảnh không bao giờ kẹt ở opacity 0. Tôn trọng reduced-motion
 * qua rule toàn cục (transition rút về ~0 → ảnh hiện ngay, không nhấp nháy).
 */
export function SmoothImage({
  src,
  alt = '',
  className,
  imgClassName,
  skeletonClassName = 'bg-surface-muted',
  fallback,
}: SmoothImageProps) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    if (ref.current?.complete) setLoaded(true);
  }, [src]);

  if (!src) {
    return <span className={clsx('block overflow-hidden', skeletonClassName, className)}>{fallback}</span>;
  }

  return (
    <span className={clsx('relative block overflow-hidden', className)}>
      <span
        aria-hidden
        className={clsx(
          'absolute inset-0 animate-pulse transition-opacity duration-300',
          skeletonClassName,
          loaded ? 'opacity-0' : 'opacity-100',
        )}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={clsx(
          'relative h-full w-full transition-opacity duration-500 ease-out',
          loaded ? 'opacity-100' : 'opacity-0',
          imgClassName ?? 'object-cover',
        )}
      />
    </span>
  );
}
