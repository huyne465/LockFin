/**
 * Fallback của trang Chụp (camera). CameraView là `fixed inset-0` nền tối, nên
 * skeleton dùng các khối trắng mờ (white/10) thay cho `Skeleton` sáng để hợp tông.
 * Mô phỏng top bar + cụm nút chụp phía dưới, giữ bố cục không nhảy khi camera lên.
 */
export default function CameraLoading() {
  return (
    <section className="fixed inset-0 z-0 flex flex-col overflow-hidden bg-[#0b0a09]">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-[90px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cta/15 blur-[90px]" />

      <header className="relative z-10 flex items-center justify-between px-5 pt-4 safe-top">
        <div className="h-9 w-24 animate-pulse rounded-full bg-white/10" />
        <div className="h-4 w-20 animate-pulse rounded-full bg-white/10" />
        <div className="h-11 w-11 animate-pulse rounded-full bg-white/10" />
      </header>

      <div className="relative z-10 mx-auto mt-4 w-[calc(100%-2.5rem)] flex-1 animate-pulse rounded-[2rem] bg-white/[0.06]" />

      <div className="relative z-10 flex items-center justify-center gap-10 px-5 pb-10 pt-6">
        <div className="h-12 w-12 animate-pulse rounded-full bg-white/10" />
        <div className="h-20 w-20 animate-pulse rounded-full bg-white/15 ring-4 ring-white/10" />
        <div className="h-12 w-12 animate-pulse rounded-full bg-white/10" />
      </div>
    </section>
  );
}
