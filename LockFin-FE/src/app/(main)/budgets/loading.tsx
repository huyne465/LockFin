import { Skeleton } from '@/components/ui/Skeleton';

/** Fallback chuyển sang Ngân sách: header + thẻ tổng quan + 2 thẻ hạn mức. */
export default function BudgetsLoading() {
  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-30 glass flex items-center gap-2 px-3 py-3.5 safe-top">
        <Skeleton className="h-11 w-11 rounded-full" />
        <Skeleton className="h-5 w-28 rounded-full" />
        <Skeleton className="ml-auto h-9 w-20 rounded-full" />
      </header>

      <div className="px-4 pb-10">
        <Skeleton className="mt-4 h-[68px] w-full rounded-2xl" />
        <div className="mt-6 space-y-2.5">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
