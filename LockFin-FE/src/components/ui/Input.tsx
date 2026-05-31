import { clsx } from 'clsx';
import { forwardRef, type InputHTMLAttributes } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={clsx(
          'w-full rounded-md border border-border bg-surface px-4 py-3 text-text',
          'placeholder:text-text-muted focus:border-primary',
          'transition-colors duration-fast',
          className,
        )}
        {...rest}
      />
    );
  },
);
