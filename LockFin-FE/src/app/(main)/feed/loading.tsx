import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Fallback khi chuyển sang Feed: dựng sẵn header + 2 thẻ polaroid để khung không
 * nhảy (CLS) và nối liền với skeleton nội bộ của trang khi React Query đang tải.
 */
export default function FeedLoading() {
  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-30 glass flex items-center justify-between px-4 py-3 safe-top">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-16 rounded-full" />
            <Skeleton className="h-3.5 w-24 rounded-full" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-14 rounded-full" />
          <Skeleton className="h-11 w-11 rounded-full" />
        </div>
      </header>

      <div className="space-y-6 p-4">
        {[0, 1].map((i) => (
          <div key={i} className="polaroid p-2.5 pb-3.5">
            <Skeleton className="aspect-[4/5] w-full rounded-[0.6rem]" />
            <div className="space-y-2 px-1.5 pt-3">
              <Skeleton className="h-4 w-1/2 rounded-full" />
              <Skeleton className="h-3 w-1/3 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
