import { Skeleton } from '@/components/ui/Skeleton';

/** Fallback chuyển sang Hồ sơ: header + thẻ streak/biểu đồ + các mục điều hướng. */
export default function ProfileLoading() {
  return (
    <div className="px-4 py-4">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="h-3 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-24 rounded-md" />
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="col-span-2 h-64 w-full rounded-2xl" />
      </div>

      <div className="mt-6 space-y-3">
        <Skeleton className="h-[60px] w-full rounded-lg" />
        <Skeleton className="h-[60px] w-full rounded-lg" />
        <Skeleton className="h-[60px] w-full rounded-lg" />
      </div>
    </div>
  );
}
