import type { Config } from 'tailwindcss';
import { tokens } from './src/styles/design-tokens';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: tokens.color.primary, hover: tokens.color.primaryHover },
        secondary: tokens.color.secondary,
        cta: tokens.color.cta,
        surface: { DEFAULT: tokens.color.surface, muted: tokens.color.surfaceMuted },
        background: tokens.color.background,
        border: tokens.color.border,
        text: {
          DEFAULT: tokens.color.text.primary,
          secondary: tokens.color.text.secondary,
          muted: tokens.color.text.muted,
          inverse: tokens.color.text.inverse,
        },
        success: tokens.color.semantic.success,
        danger: tokens.color.semantic.danger,
        warning: tokens.color.semantic.warning,
        info: tokens.color.semantic.info,
        streak: tokens.color.streak,
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: tokens.shadow.soft,
        pressed: tokens.shadow.pressed,
        card: tokens.shadow.card,
        lift: tokens.shadow.lift,
      },
      borderRadius: {
        sm: tokens.radius.sm,
        md: tokens.radius.md,
        lg: tokens.radius.lg,
        xl: tokens.radius.xl,
      },
      transitionDuration: {
        fast: tokens.motion.fast,
        base: tokens.motion.base,
        slow: tokens.motion.slow,
      },
      transitionTimingFunction: { spring: tokens.motion.spring },
    },
  },
  plugins: [],
};

export default config;
