import { create } from 'zustand';
import { WalletTransaction } from '@/types';
import { TransactionFilters } from '@/services/transactions';

interface TransactionsState {
  // Data
  transactions: WalletTransaction[];
  total: number;
  totalPages: number;
  
  // Loading states
  isLoading: boolean;
  isExporting: boolean;
  error: string | null;
  
  // Filters
  filters: TransactionFilters;
  
  // Actions
  setTransactions: (data: WalletTransaction[], total: number, totalPages: number) => void;
  setLoading: (loading: boolean) => void;
  setExporting: (exporting: boolean) => void;
  setError: (error: string | null) => void;
  updateFilters: (newFilters: Partial<TransactionFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: TransactionFilters = {
  page: 1,
  limit: 20,
  type: 'todos',
  q: ''
};

export const useTransactionsStore = create<TransactionsState>((set, get) => ({
  // Initial state
  transactions: [],
  total: 0,
  totalPages: 0,
  isLoading: false,
  isExporting: false,
  error: null,
  filters: defaultFilters,
  
  // Actions
  setTransactions: (data, total, totalPages) => set({
    transactions: data,
    total,
    totalPages,
    isLoading: false,
    error: null
  }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setExporting: (exporting) => set({ isExporting: exporting }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  updateFilters: (newFilters) => {
    const currentFilters = get().filters;
    const updatedFilters = { ...currentFilters, ...newFilters };
    
    // Reset page when changing other filters
    if (newFilters.page === undefined && Object.keys(newFilters).length > 0) {
      updatedFilters.page = 1;
    }
    
    set({ filters: updatedFilters });
  },
  
  resetFilters: () => set({ filters: defaultFilters })
}));