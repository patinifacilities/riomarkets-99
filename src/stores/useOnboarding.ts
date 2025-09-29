import { create } from 'zustand';

const STORAGE_KEY = 'rio:onb:v1';
const ONBOARDING_VERSION = '2025-09-01';

type OnboardingStep = 1 | 2 | 3;

type OnboardingState = {
  open: boolean;
  step: OnboardingStep;
  seenVersion: string | null;
  mounted: boolean;
  openOnFirstVisit: () => void;
  openManually: () => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
  reset: () => void;
  setMounted: (mounted: boolean) => void;
};

function shouldShowOnboarding(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const seenVersion = localStorage.getItem(STORAGE_KEY);
    return seenVersion !== ONBOARDING_VERSION;
  } catch {
    return true;
  }
}

export const useOnboarding = create<OnboardingState>((set, get) => ({
  open: false,
  step: 1,
  seenVersion: null,
  mounted: false,
  
  setMounted: (mounted: boolean) => {
    set({ mounted });
    if (mounted) {
      const seenVersion = typeof window !== 'undefined' 
        ? localStorage.getItem(STORAGE_KEY) 
        : null;
      set({ seenVersion });
    }
  },

  openOnFirstVisit: () => {
    // This function is now only called after successful login
    const { mounted } = get();
    if (mounted && shouldShowOnboarding()) {
      set({ open: true, step: 1 });
    }
  },

  openManually: () => {
    set({ open: true, step: 1 });
  },

  next: () => {
    const { step } = get();
    if (step < 3) {
      set({ step: (step + 1) as OnboardingStep });
    }
  },

  prev: () => {
    const { step } = get();
    if (step > 1) {
      set({ step: (step - 1) as OnboardingStep });
    }
  },

  skip: () => {
    try {
      localStorage.setItem(STORAGE_KEY, ONBOARDING_VERSION);
    } catch {
      // Silent fail for localStorage issues
    }
    set({ open: false, step: 1, seenVersion: ONBOARDING_VERSION });
  },

  reset: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Silent fail for localStorage issues
    }
    set({ seenVersion: null });
  },
}));