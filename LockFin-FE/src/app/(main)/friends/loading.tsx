import { Skeleton } from '@/components/ui/Skeleton';

/** Fallback chuyển sang Bạn bè: header + ô tìm kiếm + vài dòng bạn bè. */
export default function FriendsLoading() {
  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-30 glass flex items-center gap-2 px-3 py-3.5 safe-top">
        <Skeleton className="h-11 w-11 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </header>

      <div className="px-4 pb-8">
        <Skeleton className="mt-4 h-[60px] w-full rounded-2xl" />
        <Skeleton className="mt-3 h-[60px] w-full rounded-2xl" />
        <Skeleton className="mt-4 h-12 w-full rounded-full" />

        <Skeleton className="mb-2 mt-6 h-4 w-24 rounded-full" />
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
