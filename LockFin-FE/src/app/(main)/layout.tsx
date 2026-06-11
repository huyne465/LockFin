import { BottomNav } from '@/components/BottomNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    // Mobile: full viewport. Desktop (sm+): căn giữa, dựng khung điện thoại 390×844.
    <div className="flex min-h-[100dvh] w-full justify-center bg-background sm:items-center sm:bg-gray-100 sm:py-4">
      {/*
        transform-gpu (sm+) tạo containing block cho mọi `position: fixed` con
        (BottomNav, các overlay fixed inset-0) → chúng bám theo khung thay vì
        tràn ra cả cửa sổ desktop. Mobile không transform nên fixed = full-screen.
      */}
      <div
        className="
          relative flex h-[100dvh] w-full flex-col overflow-hidden bg-background
          sm:h-[844px] sm:max-h-[calc(100dvh-2rem)] sm:w-[390px]
          sm:transform-gpu sm:rounded-[44px] sm:ring-1 sm:ring-black/5
          sm:shadow-[0_24px_80px_rgba(0,0,0,0.18)]
        "
      >
        <main className="flex-1 overflow-y-auto overscroll-contain pb-24">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
