export type AccentColor = { main: string; soft: string; ring: string };

export const accents = {
  indigo: { main: '#4F46E5', soft: '#7C8FF0', ring: '#C7D2FE' },
  violet: { main: '#6D28D9', soft: '#8B6FE8', ring: '#D8CFF7' },
  blue: { main: '#3B5BD6', soft: '#7B6CE0', ring: '#CCD6FA' },
  cyan: { main: '#0891B2', soft: '#3FB8D6', ring: '#C4ECF5' },
  teal: { main: '#0E8A80', soft: '#37B4AA', ring: '#B2E5DF' },
  amber: { main: '#B97A1E', soft: '#DEA24C', ring: '#F1DDB4' },
  orange: { main: '#C96A2E', soft: '#E68F52', ring: '#F7D9C2' },
  emerald: { main: '#0F8B5F', soft: '#46BD8F', ring: '#BDE9D8' },
  pink: { main: '#B34567', soft: '#D97893', ring: '#F3D2DC' },
  slate: { main: '#4F586C', soft: '#7B869E', ring: '#CDD3E0' },
} as const satisfies Record<string, AccentColor>;

export const radiusTokens = {
  card: 22,
  panel: 20,
  tile: 16,
  control: 14,
  squircle: 13,
  pill: 999,
};

export const shadowTokens = {
  soft: {
    color: '#3A3F78',
    radius: 16,
    offset: { width: 0, height: 9 },
    elevation: 6,
  },
  float: {
    color: '#2E2A63',
    radius: 24,
    offset: { width: 0, height: 14 },
    elevation: 12,
  },
};

export const timingTokens = {
  micro: 160,
  fast: 220,
  base: 360,
  slow: 520,
  entrance: 620,
  stagger: 70,
};

export const glassTokens = {
  light: {
    surface: ['rgba(255,255,255,0.74)', 'rgba(245,247,253,0.55)'] as [string, string],
    gloss: ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0)'] as [string, string],
    border: 'rgba(255,255,255,0.9)',
    iconBg: 'rgba(255,255,255,0.34)',
    iconBorder: 'rgba(255,255,255,0.55)',
  },
  dark: {
    surface: ['rgba(28,35,60,0.72)', 'rgba(19,24,44,0.58)'] as [string, string],
    gloss: ['rgba(255,255,255,0.09)', 'rgba(255,255,255,0)'] as [string, string],
    border: 'rgba(255,255,255,0.13)',
    iconBg: 'rgba(255,255,255,0.08)',
    iconBorder: 'rgba(255,255,255,0.16)',
  },
};
