export interface AchievementData {
  totalQuestions: number;
  totalMockTests: number;
  currentStreak: number;
  bestAccuracy: number;
  overallAccuracy: number;
  timedAttempts: number;
  topicsCompleted: number;
}

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  target: number;
  current: (data: AchievementData) => number;
  unit?: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-mock-test',
    emoji: '🏆',
    title: 'First Mock Test',
    description: 'Complete your first full mock test',
    target: 1,
    current: (d) => d.totalMockTests,
    unit: 'tests',
  },
  {
    id: 'streak-7',
    emoji: '🔥',
    title: '7 Day Streak',
    description: 'Practice for 7 days in a row',
    target: 7,
    current: (d) => d.currentStreak,
    unit: 'days',
  },
  {
    id: 'questions-500',
    emoji: '🎯',
    title: '500 Questions',
    description: 'Answer 500 questions in total',
    target: 500,
    current: (d) => d.totalQuestions,
    unit: 'questions',
  },
  {
    id: 'accuracy-90',
    emoji: '🧠',
    title: '90% Accuracy',
    description: 'Reach 90% overall accuracy',
    target: 90,
    current: (d) => Math.round(d.overallAccuracy > 0 ? d.overallAccuracy : d.bestAccuracy),
    unit: '%',
  },
  {
    id: 'speed-master',
    emoji: '⚡',
    title: 'Speed Master',
    description: 'Complete a timed practice session',
    target: 1,
    current: (d) => d.timedAttempts,
    unit: 'timed',
  },
  {
    id: 'topics-10',
    emoji: '📚',
    title: '10 Topics Completed',
    description: 'Master 10 topics (75%+ accuracy)',
    target: 10,
    current: (d) => d.topicsCompleted,
    unit: 'topics',
  },
  {
    id: 'buet-master',
    emoji: '👑',
    title: 'BUET Master',
    description: 'Unlock every other achievement',
    target: 6,
    current: (d) =>
      [
        d.totalMockTests >= 1,
        d.currentStreak >= 7,
        d.totalQuestions >= 500,
        Math.round(d.overallAccuracy > 0 ? d.overallAccuracy : d.bestAccuracy) >= 90,
        d.timedAttempts >= 1,
        d.topicsCompleted >= 10,
      ].filter(Boolean).length,
    unit: 'achievements',
  },
];