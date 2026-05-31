export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="text-5xl">📡</div>
      <h1 className="font-display text-xl font-semibold">Bạn đang offline</h1>
      <p className="text-sm text-text-secondary">Kết nối lại để xem feed mới nhất nhé.</p>
    </main>
  );
}
