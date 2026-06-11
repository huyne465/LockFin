'use client';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from './Button';

/** Pull a human-friendly message out of whatever was thrown. */
function messageOf(error: unknown): string | undefined {
  if (!error) return undefined;
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return undefined;
}

export function ErrorState({
  error,
  title = 'Có lỗi xảy ra',
  message,
  onRetry,
  retrying,
}: {
  /** The thrown value — its message is shown when `message` isn't given. */
  error?: unknown;
  title?: string;
  /** Override text. Falls back to the error's message, then a generic line. */
  message?: string;
  /** Show a "Thử lại" button wired to this callback. */
  onRetry?: () => void;
  retrying?: boolean;
}) {
  const text = message ?? messageOf(error) ?? 'Vui lòng thử lại sau ít phút nhé.';

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h2 className="font-display text-lg font-semibold text-text">{title}</h2>
      <p className="max-w-xs text-sm text-text-secondary">{text}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} loading={retrying} className="mt-1">
          <RotateCw className="h-4 w-4" />
          Thử lại
        </Button>
      )}
    </div>
  );
}
