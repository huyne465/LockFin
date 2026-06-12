/**
 * LockFin design tokens.
 * Style: Soft UI Evolution + Habit Tracker accents.
 *
 * Colors are driven by CSS custom properties (see globals.css) so the app can
 * switch between the light "Soft UI" palette and the dark "Midnight Pop" theme.
 * Tailwind references them via `rgb(var(--x) / <alpha-value>)`, so every
 * `/opacity` modifier keeps working in both themes. The concrete light/dark
 * channel values live in globals.css — this file only names the tokens.
 */

/** Wrap a channel-triplet CSS var so Tailwind opacity modifiers compose. */
const c = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

export const tokens = {
  color: {
    primary: c('--c-primary'),
    primaryHover: c('--c-primary-hover'),
    secondary: c('--c-secondary'),
    cta: c('--c-cta'),
    surface: c('--c-surface'),
    surfaceMuted: c('--c-surface-muted'),
    background: c('--c-background'),
    border: c('--c-border'),
    text: {
      primary: c('--c-text'),
      secondary: c('--c-text-secondary'),
      muted: c('--c-text-muted'),
      inverse: c('--c-text-inverse'),
    },
    semantic: {
      success: c('--c-success'),
      danger: c('--c-danger'),
      warning: c('--c-warning'),
      info: c('--c-info'),
    },
    streak: c('--c-streak'),
  },
  font: {
    sans: "'Inter', system-ui, -apple-system, Segoe UI, sans-serif",
    display: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
  },
  radius: { sm: '0.5rem', md: '0.875rem', lg: '1.25rem', xl: '1.75rem', full: '9999px' },
  shadow: {
    soft: 'var(--shadow-soft)',
    pressed: 'var(--shadow-pressed)',
    card: 'var(--shadow-card)',
    lift: 'var(--shadow-lift)',
  },
  motion: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

export type Tokens = typeof tokens;
