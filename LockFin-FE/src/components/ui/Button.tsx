'use client';
import { clsx } from 'clsx';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost' | 'outline';
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-text-inverse shadow-soft hover:bg-primary-hover active:shadow-pressed active:scale-[0.98]',
  ghost: 'bg-transparent text-text hover:bg-surface-muted',
  outline: 'bg-surface text-text border border-border hover:bg-surface-muted',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', loading, className, children, disabled, ...rest }, ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-medium',
        'transition-all duration-base ease-spring disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        className,
      )}
      {...rest}
    >
      {loading ? 'Đang xử lý…' : children}
    </button>
  );
});
