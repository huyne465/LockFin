/**
 * LockFin design tokens — derived from docs/design-system-brief.md
 * Style: Soft UI Evolution + Habit Tracker accents. Light mode only (v1).
 */
export const tokens = {
  color: {
    primary: '#FF6B6B',
    primaryHover: '#FF5252',
    secondary: '#FFD9B3',
    cta: '#FF8A3D',
    surface: '#FFFFFF',
    surfaceMuted: '#FFF6F2',
    background: '#FFF8F4',
    border: '#F1E3D8',
    text: {
      primary: '#1F1B16',
      secondary: '#5B5249',
      muted: '#8A8078',
      inverse: '#FFFFFF',
    },
    semantic: {
      success: '#2BB673',
      danger: '#E63946',
      warning: '#F4A261',
      info: '#4A90E2',
    },
    streak: '#FF7A1A',
  },
  font: {
    sans: "'Inter', system-ui, -apple-system, Segoe UI, sans-serif",
    display: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
  },
  radius: { sm: '0.5rem', md: '0.875rem', lg: '1.25rem', xl: '1.75rem', full: '9999px' },
  shadow: {
    soft: '0 8px 24px -8px rgba(255, 107, 107, 0.18), 0 2px 6px -2px rgba(31, 27, 22, 0.06)',
    pressed: 'inset 0 2px 6px rgba(31, 27, 22, 0.12)',
    card: '0 4px 16px -4px rgba(31, 27, 22, 0.08)',
    lift: '0 12px 32px -10px rgba(31, 27, 22, 0.18)',
  },
  motion: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

export type Tokens = typeof tokens;
