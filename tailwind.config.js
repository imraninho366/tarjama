/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--tarjama-color-primary)',
        'primary-light': 'var(--tarjama-color-primary-light)',
        'primary-dim': 'var(--tarjama-color-primary-dim)',
        surface: 'var(--tarjama-color-surface)',
        'surface-elevated': 'var(--tarjama-color-surface-elevated)',
        background: 'var(--tarjama-color-background)',
        border: 'var(--tarjama-color-border)',
        success: 'var(--tarjama-color-success)',
        'success-light': 'var(--tarjama-color-success-light)',
        error: 'var(--tarjama-color-error)',
        warning: 'var(--tarjama-color-warning)',
        info: 'var(--tarjama-color-info)',
        'verse-bg': 'var(--tarjama-color-verse-bg)',
      },
      textColor: {
        DEFAULT: 'var(--tarjama-color-text)',
        secondary: 'var(--tarjama-color-text-secondary)',
        muted: 'var(--tarjama-color-text-muted)',
      },
      fontFamily: {
        display: 'var(--tarjama-font-display)',
        body: 'var(--tarjama-font-body)',
        arabic: 'var(--tarjama-font-arabic)',
        'arabic-display': 'var(--tarjama-font-arabic-display)',
      },
      borderRadius: {
        sm: 'var(--tarjama-radius-sm)',
        md: 'var(--tarjama-radius-md)',
        lg: 'var(--tarjama-radius-lg)',
        xl: 'var(--tarjama-radius-xl)',
      },
      boxShadow: {
        sm: 'var(--tarjama-shadow-sm)',
        md: 'var(--tarjama-shadow-md)',
        lg: 'var(--tarjama-shadow-lg)',
        gold: 'var(--tarjama-shadow-gold)',
      },
    },
  },
  plugins: [],
}
