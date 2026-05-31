import { BottomNav } from '@/components/BottomNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <main className="flex-1 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
