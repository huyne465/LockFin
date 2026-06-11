'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Camera, KeyRound, Loader2, UserRound } from 'lucide-react';
import { useProfile, useUpdateProfile } from '@/lib/queries';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { NotificationToggle } from '@/components/NotificationToggle';

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-2xl bg-surface p-4 shadow-card">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-secondary">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const push = useToast((s) => s.push);
  const profile = useProfile();
  const updateProfile = useUpdateProfile();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  // Seed the name field once the profile loads.
  useEffect(() => {
    if (profile.data) setDisplayName(profile.data.display_name ?? '');
  }, [profile.data]);

  const p = profile.data;
  const nameChanged = p ? displayName.trim() !== (p.display_name ?? '') : false;

  async function onSaveName() {
    const name = displayName.trim();
    if (!name) return push('Tên hiển thị không được để trống', 'error');
    try {
      await updateProfile.mutateAsync({ display_name: name });
      push('Đã cập nhật tên hiển thị ✓', 'success');
    } catch (e) {
      push(e instanceof Error ? e.message : 'Lưu thất bại, thử lại nhé', 'error');
    }
  }

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file || !p) return;
    if (!file.type.startsWith('image/')) return push('Chọn một ảnh nhé', 'error');
    if (file.size > 5 * 1024 * 1024) return push('Ảnh tối đa 5MB', 'error');

    setAvatarUploading(true);
    try {
      const supabase = createSupabaseBrowser();
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `avatars/${p.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('posts')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(path);
      await updateProfile.mutateAsync({ avatar_url: publicUrl });
      push('Đã cập nhật ảnh đại diện ✓', 'success');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Tải ảnh thất bại, thử lại nhé', 'error');
    } finally {
      setAvatarUploading(false);
    }
  }

  async function onChangePassword() {
    if (newPwd.length < 6) return push('Mật khẩu mới tối thiểu 6 ký tự', 'error');
    if (newPwd !== confirmPwd) return push('Mật khẩu xác nhận không khớp', 'error');

    setPwdSaving(true);
    try {
      const supabase = createSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email;
      if (!email) throw new Error('Không tìm thấy email tài khoản');

      // Re-authenticate to verify the current password before changing it.
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: currentPwd });
      if (signInErr) throw new Error('Mật khẩu hiện tại không đúng');

      const { error: updErr } = await supabase.auth.updateUser({ password: newPwd });
      if (updErr) throw updErr;

      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      push('Đã đổi mật khẩu ✓', 'success');
    } catch (err) {
      push(err instanceof Error ? err.message : 'Đổi mật khẩu thất bại, thử lại nhé', 'error');
    } finally {
      setPwdSaving(false);
    }
  }

  const initial = (p?.display_name?.trim() || p?.username || '?')[0]?.toUpperCase() ?? '?';

  return (
    <div className="min-h-full bg-background">
      <header className="sticky top-0 z-30 glass flex items-center gap-2 px-3 py-3.5 safe-top">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Quay lại"
          className="flex h-11 w-11 items-center justify-center rounded-full text-text-secondary transition-transform duration-fast active:scale-90"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-display text-lg font-bold">Cài đặt</h1>
      </header>

      <div className="px-4 pb-12">
        {/* Avatar */}
        <div className="mt-5 flex flex-col items-center">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={avatarUploading || !p}
            className="group relative h-24 w-24 overflow-hidden rounded-full bg-surface-muted ring-2 ring-primary/15 disabled:opacity-60"
            aria-label="Đổi ảnh đại diện"
          >
            {p?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-display text-3xl font-semibold text-text-secondary">
                {initial}
              </span>
            )}
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/45 py-1.5 text-text-inverse">
              {avatarUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickAvatar}
          />
          <p className="mt-2 text-xs text-text-muted">Nhấn vào ảnh để đổi ảnh đại diện</p>
        </div>

        {/* Display name */}
        <Card title="Thông tin hiển thị" icon={<UserRound className="h-4 w-4" />}>
          <label className="block text-xs font-medium text-text-muted">Tên hiển thị</label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Tên của bạn"
            maxLength={50}
            className="mt-1"
          />
          <label className="mt-3 block text-xs font-medium text-text-muted">Username (không đổi được)</label>
          <Input value={p?.username ?? ''} disabled readOnly className="mt-1 opacity-60" />
          <Button
            className="mt-4 w-full"
            loading={updateProfile.isPending && nameChanged}
            disabled={!nameChanged}
            onClick={onSaveName}
          >
            Lưu thay đổi
          </Button>
        </Card>

        {/* Notifications */}
        <Card title="Thông báo" icon={<Bell className="h-4 w-4" />}>
          <NotificationToggle />
        </Card>

        {/* Password */}
        <Card title="Đổi mật khẩu" icon={<KeyRound className="h-4 w-4" />}>
          <Input
            type="password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            placeholder="Mật khẩu hiện tại"
            autoComplete="current-password"
          />
          <Input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
            autoComplete="new-password"
            className="mt-2"
          />
          <Input
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            placeholder="Xác nhận mật khẩu mới"
            autoComplete="new-password"
            className="mt-2"
          />
          <Button
            className="mt-4 w-full"
            loading={pwdSaving}
            disabled={!currentPwd || !newPwd || !confirmPwd}
            onClick={onChangePassword}
          >
            Đổi mật khẩu
          </Button>
        </Card>
      </div>
    </div>
  );
}
