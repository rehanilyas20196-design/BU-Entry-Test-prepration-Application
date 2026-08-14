import { create } from 'zustand';

export interface MockTestState {
  attemptId: string | null;
  mode: 'practice' | 'timed_practice' | 'full_mock' | 'hard_mock';
  questions: { order: number; question: MockTestQuestion }[];
  answers: Record<number, string>;
  markedForReview: Set<number>;
  currentIndex: number;
  secondsRemaining: number | null;
  startedAt: number | null;
  setAttempt: (data: {
    attemptId: string;
    mode: MockTestState['mode'];
    questions: MockTestState['questions'];
    durationMinutes?: number;
  }) => void;
  answer: (index: number, option: string) => void;
  toggleReview: (index: number) => void;
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
}

export interface MockTestQuestion {
  id: string;
  subject_id: string;
  topic_id: string | null;
  difficulty: string;
  question_text: string;
  options: { key: string; text: string }[];
}

const initial: Omit<MockTestState, 'setAttempt' | 'answer' | 'toggleReview' | 'goTo' | 'next' | 'prev' | 'reset'> = {
  attemptId: null,
  mode: 'practice',
  questions: [],
  answers: {},
  markedForReview: new Set(),
  currentIndex: 0,
  secondsRemaining: null,
  startedAt: null,
};

export const useMockTestStore = create<MockTestState>((set) => ({
  ...initial,

  setAttempt: ({ attemptId, mode, questions, durationMinutes }) =>
    set({
      attemptId,
      mode,
      questions,
      answers: {},
      markedForReview: new Set(),
      currentIndex: 0,
      secondsRemaining: durationMinutes ? durationMinutes * 60 : null,
      startedAt: Date.now(),
    }),

  answer: (index, option) =>
    set((state) => ({ answers: { ...state.answers, [index]: option } })),

  toggleReview: (index) =>
    set((state) => {
      const next = new Set(state.markedForReview);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return { markedForReview: next };
    }),

  goTo: (index) => set({ currentIndex: index }),
  next: () => set((state) => ({ currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1) })),
  prev: () => set((state) => ({ currentIndex: Math.max(state.currentIndex - 1, 0) })),
  reset: () => set({ ...initial }),
}));
