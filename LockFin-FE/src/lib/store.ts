import { create } from 'zustand';
import { currentMonth } from './format';

interface UiState {
  capturedBlob: Blob | null;
  setCapturedBlob: (b: Blob | null) => void;
  month: string;
  setMonth: (m: string) => void;
}

export const useUi = create<UiState>((set) => ({
  capturedBlob: null,
  setCapturedBlob: (b) => set({ capturedBlob: b }),
  month: currentMonth(),
  setMonth: (m) => set({ month: m }),
}));
