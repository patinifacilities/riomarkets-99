import { create } from 'zustand';

type Message = { 
  role: 'user' | 'assistant'; 
  text: string; 
  ts: number; 
};

type State = {
  isOpen: boolean;
  messages: Message[];
  showTextInput: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  add: (m: Message) => void;
  reset: () => void;
  setShowTextInput: (show: boolean) => void;
};

export const useRianaStore = create<State>((set) => ({
  isOpen: false,
  showTextInput: false,
  messages: [
    { 
      role: 'assistant', 
      text: 'Olá, eu sou a Riana 👋 Como posso ajudar?', 
      ts: Date.now() 
    }
  ],
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  add: (m) => set((state) => ({ messages: [...state.messages, m] })),
  reset: () => set({ 
    messages: [
      { 
        role: 'assistant', 
        text: 'Olá, eu sou a Riana 👋 Como posso ajudar?', 
        ts: Date.now() 
      }
    ],
    showTextInput: false
  }),
  setShowTextInput: (show) => set({ showTextInput: show })
}));

// Global event listener for footer button
if (typeof window !== 'undefined') {
  window.addEventListener('riana:toggle', () => {
    useRianaStore.getState().toggle();
  });
}