import { create } from 'zustand';
import { PressArticle, PressFilters, fetchPressArticles, getVehicles } from '@/services/press';

interface PressState {
  articles: PressArticle[];
  vehicles: string[];
  filters: PressFilters;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchArticles: () => Promise<void>;
  fetchVehicles: () => Promise<void>;
  setFilters: (filters: Partial<PressFilters>) => void;
  resetFilters: () => void;
}

export const usePressStore = create<PressState>((set, get) => ({
  articles: [],
  vehicles: [],
  filters: {},
  loading: false,
  error: null,

  fetchArticles: async () => {
    set({ loading: true, error: null });
    try {
      const articles = await fetchPressArticles(get().filters);
      set({ articles, loading: false });
    } catch (error) {
      set({ error: 'Erro ao carregar artigos', loading: false });
    }
  },

  fetchVehicles: async () => {
    try {
      const vehicles = await getVehicles();
      set({ vehicles });
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  },

  setFilters: (newFilters) => {
    const filters = { ...get().filters, ...newFilters };
    set({ filters });
    get().fetchArticles();
  },

  resetFilters: () => {
    set({ filters: {} });
    get().fetchArticles();
  },
}));