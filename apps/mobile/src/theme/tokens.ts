export type AccentColor = { main: string; soft: string; ring: string };

export const accents = {
  indigo: { main: '#2563EB', soft: '#60A5FA', ring: '#DBEAFE' },
  violet: { main: '#7C3AED', soft: '#A78BFA', ring: '#EDE9FE' },
  blue: { main: '#2563EB', soft: '#60A5FA', ring: '#DBEAFE' },
  cyan: { main: '#0891B2', soft: '#22D3EE', ring: '#CFFAFE' },
  teal: { main: '#0D9488', soft: '#2DD4BF', ring: '#CCFBF1' },
  amber: { main: '#D97706', soft: '#F59E0B', ring: '#FEF3C7' },
  orange: { main: '#EA580C', soft: '#FB923C', ring: '#FFEDD5' },
  emerald: { main: '#059669', soft: '#34D399', ring: '#D1FAE5' },
  pink: { main: '#DB2777', soft: '#F472B6', ring: '#FCE7F3' },
  slate: { main: '#64748B', soft: '#94A3B8', ring: '#E2E8F0' },
} as const satisfies Record<string, AccentColor>;

export const radiusTokens = {
  card: 12,
  panel: 12,
  tile: 12,
  control: 8,
  squircle: 10,
  pill: 999,
};

export const shadowTokens = {
  soft: {
    color: '#0F172A',
    radius: 3,
    offset: { width: 0, height: 1 },
    elevation: 1,
  },
  float: {
    color: '#0F172A',
    radius: 8,
    offset: { width: 0, height: 2 },
    elevation: 3,
  },
};

export const timingTokens = {
  micro: 150,
  fast: 200,
  base: 250,
  slow: 300,
  entrance: 300,
  stagger: 40,
};

export const glassTokens = {
  light: {
    surface: ['rgba(255,255,255,0.92)', 'rgba(248,250,252,0.96)'] as [string, string],
    gloss: ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)'] as [string, string],
    border: 'rgba(226,232,240,0.9)',
    iconBg: 'rgba(255,255,255,0.6)',
    iconBorder: 'rgba(226,232,240,0.9)',
  },
  dark: {
    surface: ['rgba(248,250,252,0.96)', 'rgba(255,255,255,0.92)'] as [string, string],
    gloss: ['rgba(255,255,255,0.8)', 'rgba(255,255,255,0)'] as [string, string],
    border: 'rgba(226,232,240,0.9)',
    iconBg: 'rgba(255,255,255,0.6)',
    iconBorder: 'rgba(226,232,240,0.9)',
  },
};

