export const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'] as const;
export type Planet = typeof PLANETS[number];

export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
] as const;
export type Sign = typeof SIGNS[number];

export const HOUSES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
export type House = typeof HOUSES[number];

// Sign Classifications
export const SIGN_MOBILITY: Record<Sign, 'Movable' | 'Fixed' | 'Dual'> = {
  Aries: 'Movable', Taurus: 'Fixed', Gemini: 'Dual',
  Cancer: 'Movable', Leo: 'Fixed', Virgo: 'Dual',
  Libra: 'Movable', Scorpio: 'Fixed', Sagittarius: 'Dual',
  Capricorn: 'Movable', Aquarius: 'Fixed', Pisces: 'Dual'
};

export const SIGN_GENDER: Record<Sign, 'Male' | 'Female'> = {
  Aries: 'Male', Taurus: 'Female', Gemini: 'Male', Cancer: 'Female',
  Leo: 'Male', Virgo: 'Female', Libra: 'Male', Scorpio: 'Female',
  Sagittarius: 'Male', Capricorn: 'Female', Aquarius: 'Male', Pisces: 'Female'
};

export const SIGN_ELEMENT: Record<Sign, 'Fire' | 'Earth' | 'Air' | 'Water'> = {
  Aries: 'Fire', Taurus: 'Earth', Gemini: 'Air', Cancer: 'Water',
  Leo: 'Fire', Virgo: 'Earth', Libra: 'Air', Scorpio: 'Water',
  Sagittarius: 'Fire', Capricorn: 'Earth', Aquarius: 'Air', Pisces: 'Water'
};

export const SIGN_NATURE: Record<Sign, 'Malefic' | 'Benefic'> = {
  // Generally odd/male signs are considered malefic/cruel, even/female are benefic/gentle
  Aries: 'Malefic', Taurus: 'Benefic', Gemini: 'Malefic', Cancer: 'Benefic',
  Leo: 'Malefic', Virgo: 'Benefic', Libra: 'Malefic', Scorpio: 'Benefic',
  Sagittarius: 'Malefic', Capricorn: 'Benefic', Aquarius: 'Malefic', Pisces: 'Benefic'
};

export const SIGN_TEMPERAMENT: Record<Sign, 'Bilious' | 'Windy' | 'Phlegmatic' | 'Mixed'> = {
  Aries: 'Bilious', Taurus: 'Windy', Gemini: 'Mixed', Cancer: 'Phlegmatic',
  Leo: 'Bilious', Virgo: 'Windy', Libra: 'Mixed', Scorpio: 'Phlegmatic',
  Sagittarius: 'Bilious', Capricorn: 'Windy', Aquarius: 'Mixed', Pisces: 'Phlegmatic'
};

export const SIGN_BIOLOGY: Record<Sign, 'Quadruped' | 'Biped' | 'Footless' | 'Centipede'> = {
  Aries: 'Quadruped', Taurus: 'Quadruped', Gemini: 'Biped', Cancer: 'Centipede',
  Leo: 'Quadruped', Virgo: 'Biped', Libra: 'Biped', Scorpio: 'Centipede',
  Sagittarius: 'Quadruped', /* (first half biped, second half quadruped technically, simplified here) */
  Capricorn: 'Quadruped', /* (first half quad, second half footless) */
  Aquarius: 'Biped', Pisces: 'Footless'
};

export const SIGN_TEMPORAL: Record<Sign, 'Diurnal' | 'Nocturnal'> = {
  Aries: 'Nocturnal', Taurus: 'Nocturnal', Gemini: 'Nocturnal', Cancer: 'Nocturnal',
  Leo: 'Diurnal', Virgo: 'Diurnal', Libra: 'Diurnal', Scorpio: 'Diurnal',
  Sagittarius: 'Nocturnal', Capricorn: 'Nocturnal', Aquarius: 'Diurnal', Pisces: 'Diurnal' // Note: This varies slightly by text, using a standard convention.
};

export const SIGN_LORDS: Record<Sign, Planet> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter'
};

// Dignities
export const EXALTATION: Record<Planet, { sign: Sign, degree: number }> = {
  Sun: { sign: 'Aries', degree: 10 },
  Moon: { sign: 'Taurus', degree: 3 },
  Mars: { sign: 'Capricorn', degree: 28 },
  Mercury: { sign: 'Virgo', degree: 15 },
  Jupiter: { sign: 'Cancer', degree: 5 },
  Venus: { sign: 'Pisces', degree: 27 },
  Saturn: { sign: 'Libra', degree: 20 },
  Rahu: { sign: 'Taurus', degree: 15 }, // Varies by text, standardly Taurus
  Ketu: { sign: 'Scorpio', degree: 15 } // Standardly Scorpio
};

export const DEBILITATION: Record<Planet, { sign: Sign, degree: number }> = {
  Sun: { sign: 'Libra', degree: 10 },
  Moon: { sign: 'Scorpio', degree: 3 },
  Mars: { sign: 'Cancer', degree: 28 },
  Mercury: { sign: 'Pisces', degree: 15 },
  Jupiter: { sign: 'Capricorn', degree: 5 },
  Venus: { sign: 'Virgo', degree: 27 },
  Saturn: { sign: 'Aries', degree: 20 },
  Rahu: { sign: 'Scorpio', degree: 15 },
  Ketu: { sign: 'Taurus', degree: 15 }
};

export const MOOLATRIKONA: Record<Planet, { sign: Sign, degStart: number, degEnd: number }> = {
  Sun: { sign: 'Leo', degStart: 0, degEnd: 20 },
  Moon: { sign: 'Taurus', degStart: 4, degEnd: 30 },
  Mars: { sign: 'Aries', degStart: 0, degEnd: 12 },
  Mercury: { sign: 'Virgo', degStart: 16, degEnd: 20 },
  Jupiter: { sign: 'Sagittarius', degStart: 0, degEnd: 10 },
  Venus: { sign: 'Libra', degStart: 0, degEnd: 15 },
  Saturn: { sign: 'Aquarius', degStart: 0, degEnd: 20 },
  Rahu: { sign: 'Gemini', degStart: 0, degEnd: 30 }, // Varies
  Ketu: { sign: 'Sagittarius', degStart: 0, degEnd: 30 } // Varies
};

// Planetary Attributes
export const PLANET_NATURE: Record<Planet, 'Benefic' | 'Malefic'> = {
  Sun: 'Malefic',
  Moon: 'Benefic', // Can be malefic if waning, handled dynamically
  Mars: 'Malefic',
  Mercury: 'Benefic', // Can be malefic if conjunct malefic, handled dynamically
  Jupiter: 'Benefic',
  Venus: 'Benefic',
  Saturn: 'Malefic',
  Rahu: 'Malefic',
  Ketu: 'Malefic'
};

export const PLANET_GENDER: Record<Planet, 'Male' | 'Female' | 'Eunuch'> = {
  Sun: 'Male', Moon: 'Female', Mars: 'Male', Mercury: 'Eunuch',
  Jupiter: 'Male', Venus: 'Female', Saturn: 'Eunuch', Rahu: 'Female', Ketu: 'Eunuch'
};

// Natural Relationships (Naisargika Mitra/Satru/Sama)
// Key is the base planet, array is the relation to other planets
export const NATURAL_RELATIONS: Record<Planet, { Friends: Planet[], Enemies: Planet[], Neutral: Planet[] }> = {
  Sun: { Friends: ['Moon', 'Mars', 'Jupiter'], Enemies: ['Venus', 'Saturn', 'Rahu', 'Ketu'], Neutral: ['Mercury'] },
  Moon: { Friends: ['Sun', 'Mercury'], Enemies: ['Rahu', 'Ketu'], Neutral: ['Mars', 'Jupiter', 'Venus', 'Saturn'] },
  Mars: { Friends: ['Sun', 'Moon', 'Jupiter'], Enemies: ['Mercury', 'Rahu', 'Ketu'], Neutral: ['Venus', 'Saturn'] },
  Mercury: { Friends: ['Sun', 'Venus'], Enemies: ['Moon'], Neutral: ['Mars', 'Jupiter', 'Saturn', 'Rahu', 'Ketu'] },
  Jupiter: { Friends: ['Sun', 'Moon', 'Mars'], Enemies: ['Mercury', 'Venus'], Neutral: ['Saturn', 'Rahu', 'Ketu'] },
  Venus: { Friends: ['Mercury', 'Saturn', 'Rahu', 'Ketu'], Enemies: ['Sun', 'Moon'], Neutral: ['Mars', 'Jupiter'] },
  Saturn: { Friends: ['Mercury', 'Venus', 'Rahu', 'Ketu'], Enemies: ['Sun', 'Moon', 'Mars'], Neutral: ['Jupiter'] },
  Rahu: { Friends: ['Jupiter', 'Venus', 'Saturn'], Enemies: ['Sun', 'Moon', 'Mars'], Neutral: ['Mercury', 'Ketu'] },
  Ketu: { Friends: ['Mars', 'Venus', 'Saturn'], Enemies: ['Sun', 'Moon'], Neutral: ['Mercury', 'Jupiter', 'Rahu'] }
};

// House Groups
export const KENDRA_HOUSES: House[] = [1, 4, 7, 10];
export const TRIKONA_HOUSES: House[] = [1, 5, 9];
export const DUSTHANA_HOUSES: House[] = [6, 8, 12];
export const UPACHAYA_HOUSES: House[] = [3, 6, 10, 11];
export const PANAPHARA_HOUSES: House[] = [2, 5, 8, 11];
export const APOKLIMA_HOUSES: House[] = [3, 6, 9, 12];
export const MARAKA_HOUSES: House[] = [2, 7];
