'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import Webcam from 'react-webcam';
import { RefreshCw, Zap, ZapOff, Images, Flame } from 'lucide-react';
import { useProfile } from '@/lib/queries';
import { UploadModal } from './UploadModal';

export function CameraView() {
  const webcamRef = useRef<Webcam | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [facing, setFacing] = useState<'environment' | 'user'>('user');
  const [flash, setFlash] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: profile } = useProfile();

  const capture = useCallback(async () => {
    const dataUrl = webcamRef.current?.getScreenshot();
    if (!dataUrl) return;
    const res = await fetch(dataUrl);
    const b = await res.blob();
    setBlob(b);
    setPreviewUrl(dataUrl);
  }, []);

  const onPick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBlob(file);
    setPreviewUrl(URL.createObjectURL(file));
    e.target.value = '';
  }, []);

  const close = () => { setBlob(null); setPreviewUrl(null); };

  return (
    <section className="relative flex h-dvh w-full flex-col overflow-hidden bg-[#0b0a09]">
      {/* ambient glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/25 blur-[90px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cta/20 blur-[90px]" />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-4 safe-top">
        <Link
          href="/feed"
          className="glass-pill flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold text-text-inverse"
        >
          <Flame className="h-4 w-4 text-streak" />
          <span className="numeric">{profile?.current_streak ?? 0}</span>
          <span className="opacity-70">streak</span>
        </Link>

        <span className="font-display text-base font-semibold text-text-inverse/90">LockFin</span>

        <Link
          href="/profile"
          aria-label="Hồ sơ"
          className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-white/30"
        >
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="glass-dark flex h-full w-full items-center justify-center font-display text-sm font-semibold text-text-inverse">
              {profile?.display_name?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
        </Link>
      </header>

      {/* Viewfinder */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-5">
        <div className="relative aspect-square w-full max-w-sm overflow-hidden rounded-[2.25rem] bg-black shadow-lift ring-1 ring-white/10 animate-pop-in">
          <Webcam
            ref={webcamRef}
            audio={false}
            mirrored={facing === 'user'}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.92}
            videoConstraints={{ facingMode: facing }}
            className="h-full w-full object-cover"
          />

          {/* flash toggle */}
          <button
            onClick={() => setFlash((f) => !f)}
            aria-label="Đèn flash"
            className="glass-dark absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-text-inverse transition-transform duration-fast active:scale-90"
          >
            {flash ? <Zap className="h-5 w-5 text-cta" /> : <ZapOff className="h-5 w-5" />}
          </button>

          {/* zoom chip (decorative) */}
          <span className="glass-dark absolute right-3 top-3 flex h-10 items-center rounded-full px-3 text-sm font-semibold text-text-inverse">
            1×
          </span>

          {flash && <div className="pointer-events-none absolute inset-0 bg-white/10" />}
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 flex items-center justify-center gap-10 px-5 pb-3">
        <button
          onClick={() => fileRef.current?.click()}
          aria-label="Chọn từ thư viện"
          className="glass-dark flex h-12 w-12 items-center justify-center rounded-full text-text-inverse transition-transform duration-fast active:scale-90"
        >
          <Images className="h-6 w-6" />
        </button>

        <button
          onClick={capture}
          aria-label="Chụp"
          className="group relative flex h-20 w-20 items-center justify-center rounded-full"
        >
          <span className="absolute inset-0 rounded-full ring-[5px] ring-cta transition-transform duration-base ease-spring group-active:scale-90" />
          <span className="h-[3.75rem] w-[3.75rem] rounded-full bg-white shadow-soft transition-transform duration-base ease-spring group-active:scale-90" />
        </button>

        <button
          onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))}
          aria-label="Đổi camera"
          className="glass-dark flex h-12 w-12 items-center justify-center rounded-full text-text-inverse transition-transform duration-fast active:scale-90 active:-rotate-180"
        >
          <RefreshCw className="h-6 w-6" />
        </button>
      </div>

      {/* History hint → memories */}
      <div className="relative z-10 flex justify-center pb-28">
        <Link href="/memories" className="flex items-center gap-1.5 text-sm font-semibold text-text-inverse/70 transition-colors hover:text-text-inverse">
          <span>Kỷ niệm</span>
          <span className="text-xs opacity-70">⌄</span>
        </Link>
      </div>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />

      {blob && previewUrl && <UploadModal blob={blob} previewUrl={previewUrl} onClose={close} />}
    </section>
  );
}
