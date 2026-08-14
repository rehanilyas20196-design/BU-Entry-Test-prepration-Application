import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BookmarkTagsState {
  reviewLater: string[];
  important: string[];
  toggleReviewLater: (questionId: string) => void;
  toggleImportant: (questionId: string) => void;
  isReviewLater: (questionId: string) => boolean;
  isImportant: (questionId: string) => boolean;
}

const STORAGE_KEY = 'buetprep.bookmark-tags';

function persist(state: { reviewLater: string[]; important: string[] }) {
  AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ reviewLater: state.reviewLater, important: state.important }),
  ).catch(() => {});
}

export const useBookmarkTagsStore = create<BookmarkTagsState>((set, get) => ({
  reviewLater: [],
  important: [],
  toggleReviewLater: (questionId) =>
    set((s) => {
      const reviewLater = s.reviewLater.includes(questionId)
        ? s.reviewLater.filter((id) => id !== questionId)
        : [...s.reviewLater, questionId];
      persist({ reviewLater, important: s.important });
      return { reviewLater };
    }),
  toggleImportant: (questionId) =>
    set((s) => {
      const important = s.important.includes(questionId)
        ? s.important.filter((id) => id !== questionId)
        : [...s.important, questionId];
      persist({ important, reviewLater: s.reviewLater });
      return { important };
    }),
  isReviewLater: (questionId) => get().reviewLater.includes(questionId),
  isImportant: (questionId) => get().important.includes(questionId),
}));

export async function hydrateBookmarkTagsStore() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      useBookmarkTagsStore.setState({
        reviewLater: Array.isArray(parsed?.reviewLater) ? parsed.reviewLater : [],
        important: Array.isArray(parsed?.important) ? parsed.important : [],
      });
    }
  } catch {
    // ignore hydration errors
  }
}