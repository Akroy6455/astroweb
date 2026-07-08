

export const PD_AUSPICIOUSNESS_MATRIX: Record<string, Record<string, number>> = {
  'Sun': {
    'Sun': 20, 'Moon': 20, 'Mars': 10, 'Rahu': 5, 'Jupiter': 90, 'Saturn': 20, 'Mercury': 85, 'Ketu': 5, 'Venus': 60
  },
  'Moon': {
    'Sun': 95, 'Moon': 85, 'Mars': 70, 'Rahu': 50, 'Jupiter': 95, 'Saturn': 15, 'Mercury': 90, 'Ketu': 5, 'Venus': 90
  },
  'Mars': {
    'Sun': 90, 'Moon': 90, 'Mars': 10, 'Rahu': 5, 'Jupiter': 5, 'Saturn': 10, 'Mercury': 15, 'Ketu': 5, 'Venus': 10
  },
  'Rahu': {
    'Sun': 10, 'Moon': 15, 'Mars': 10, 'Rahu': 10, 'Jupiter': 90, 'Saturn': 5, 'Mercury': 95, 'Ketu': 15, 'Venus': 10
  },
  'Jupiter': {
    'Sun': 90, 'Moon': 90, 'Mars': 15, 'Rahu': 20, 'Jupiter': 85, 'Saturn': 85, 'Mercury': 90, 'Ketu': 30, 'Venus': 95
  },
  'Saturn': {
    'Sun': 55, 'Moon': 50, 'Mars': 15, 'Rahu': 10, 'Jupiter': 25, 'Saturn': 20, 'Mercury': 15, 'Ketu': 5, 'Venus': 95
  },
  'Mercury': {
    'Sun': 15, 'Moon': 95, 'Mars': 50, 'Rahu': 20, 'Jupiter': 95, 'Saturn': 15, 'Mercury': 90, 'Ketu': 20, 'Venus': 70
  },
  'Ketu': {
    'Sun': 5, 'Moon': 15, 'Mars': 10, 'Rahu': 15, 'Jupiter': 10, 'Saturn': 15, 'Mercury': 10, 'Ketu': 10, 'Venus': 15
  },
  'Venus': {
    'Sun': 20, 'Moon': 90, 'Mars': 15, 'Rahu': 15, 'Jupiter': 95, 'Saturn': 40, 'Mercury': 90, 'Ketu': 20, 'Venus': 90
  }
};

export function getPdAuspiciousness(adLord: string, pdLord: string): number {
  if (!PD_AUSPICIOUSNESS_MATRIX[adLord] || PD_AUSPICIOUSNESS_MATRIX[adLord][pdLord] === undefined) {
    return 50; // Fallback default
  }
  return PD_AUSPICIOUSNESS_MATRIX[adLord][pdLord];
}

export function getPdAuspiciousnessCategory(score: number): { label: string, color: string } {
  if (score >= 90) return { label: 'Excellent', color: '#22c55e' }; // Green
  if (score >= 70) return { label: 'Good', color: '#84cc16' }; // Light Green
  if (score >= 40) return { label: 'Mixed', color: '#eab308' }; // Yellow
  if (score >= 20) return { label: 'Bad', color: '#f97316' }; // Orange
  return { label: 'Severe', color: '#ef4444' }; // Red
}
