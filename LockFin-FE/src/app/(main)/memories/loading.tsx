import { Skeleton } from '@/components/ui/Skeleton';

/** Fallback chuyển sang Kỷ niệm: header + lưới album + bộ chọn tháng + lịch. */
export default function MemoriesLoading() {
  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-30 glass flex items-center justify-between px-5 py-3.5 safe-top">
        <span className="w-10" />
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-11 w-11 rounded-full" />
      </header>

      <div className="px-4 pt-4">
        <div className="mb-5">
          <div className="mb-2.5 flex items-center justify-between px-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
        </div>

        <Skeleton className="mb-3 h-[60px] w-full rounded-2xl" />

        <div className="mb-4 grid grid-cols-2 gap-3">
          <Skeleton className="h-[68px] w-full rounded-2xl" />
          <Skeleton className="h-[68px] w-full rounded-2xl" />
        </div>

        <Skeleton className="h-96 w-full rounded-[1.75rem]" />
      </div>
    </div>
  );
}
