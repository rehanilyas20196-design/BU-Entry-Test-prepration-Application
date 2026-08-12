// BUET test-format constants. Keep every number here — do not scatter in screens.

export const BUET_CONFIG = {
  /** Number of MCQs in a full mock test. */
  TOTAL_QUESTIONS: 100,
  /** Time limit for a full mock test, in minutes. */
  DURATION_MINUTES: 120,
  /** Options per question. */
  OPTIONS_PER_QUESTION: 4,
  /** No negative marking in BUET. */
  NEGATIVE_MARKING: false,
  /** Passing percentage (used for pass/fail badge on results). */
  PASS_PERCENTAGE: 50,
} as const;

export type ProgramTrack = 'CS_ENGINEERING' | 'BUSINESS' | 'MEDICAL' | 'PSYCHOLOGY';

/**
 * Section weightings per program track (as percentage points).
 * Reflects the official BUET pattern:
 *  - CS/Engineering: Verbal, Quantitative, Analytical, GK
 *  - Business/Management: Verbal-heavy
 *  - Medical: Biology/Chemistry/Physics-heavy
 *  - Psychology/English/Islamic Studies: Verbal + GK + Analytical
 */
export const PROGRAM_TRACKS: Record<
  ProgramTrack,
  { label: string; weightings: Record<string, number> }
> = {
  CS_ENGINEERING: {
    label: 'CS / Engineering',
    weightings: { Verbal: 30, Quantitative: 25, Analytical: 20, GK: 15, Physics: 10 },
  },
  BUSINESS: {
    label: 'Business / Management',
    weightings: { Verbal: 50, Quantitative: 15, Analytical: 15, GK: 20 },
  },
  MEDICAL: {
    label: 'Medical Sciences',
    weightings: { Verbal: 25, Physics: 25, Chemistry: 25, Biology: 25 },
  },
  PSYCHOLOGY: {
    label: 'Psychology / English / Islamic Studies',
    weightings: { Verbal: 50, GK: 25, Analytical: 25 },
  },
};

/** Canonical subject keys used across the question bank. */
export const SUBJECTS = {
  VERBAL: 'English / Verbal',
  QUANT: 'Quantitative Reasoning',
  ANALYTICAL: 'Analytical Reasoning',
  GK: 'General Knowledge',
  PHYSICS: 'Physics',
  CHEMISTRY: 'Chemistry',
  BIOLOGY: 'Biology',
} as const;
