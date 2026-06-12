'use client';
import { clsx } from 'clsx';

const ICON_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/icons/`;

/**
 * Resolve a category's `icon` value to an image URL, or `null` when it's a plain
 * emoji/text. Stored values are either a bucket filename ("…​.svg") or a full URL;
 * legacy rows still hold an emoji, which falls through to text rendering.
 */
function iconSrc(icon: string): string | null {
  if (icon.startsWith('http')) return icon;
  if (icon.endsWith('.svg')) return ICON_BASE + encodeURIComponent(icon);
  return null;
}

/**
 * Renders a category icon: a CSS-masked <span> for bucket SVGs, otherwise the
 * emoji as text. The SVG is used as a mask painted with `currentColor`, so the
 * icon inherits the surrounding text colour — correct in light & dark with no
 * per-theme asset, and recolourable anywhere by setting `color` (e.g. a text-*
 * class). Size follows the surrounding font-size (1.15em), so pass the same
 * text-* class the old <span> used to keep it visually identical.
 */
export function CategoryIcon({ icon, className }: { icon?: string | null; className?: string }) {
  const src = icon ? iconSrc(icon) : null;
  if (src) {
    return (
      <span
        aria-hidden
        style={{ ['--cat-icon' as string]: `url("${src}")` }}
        className={clsx('category-icon inline-block h-[1.15em] w-[1.15em] shrink-0 align-[-0.15em]', className)}
      />
    );
  }
  return <span className={className}>{icon ?? '💰'}</span>;
}
