import { create } from 'zustand';
import { track } from '@/lib/analytics';

export interface RewardCalcResults {
  retornoBruto: number;
  recompensaLiquida: number;
  roi: number;
  pBreakeven: number;
  desvio?: number;
}

export interface RewardCalcState {
  // Inputs
  value: number;
  pUser: number; // 0-1
  pMkt?: number | null; // 0-1 opcional
  fee: number; // default 0.20
  cashout: boolean;
  cashoutFee: number; // default 0.02
  
  // Results
  results: RewardCalcResults;
  
  // Modal state
  isOpen: boolean;
  marketId?: string;
  
  // Actions
  setValue: (value: number) => void;
  setPUser: (pUser: number) => void;
  setPMkt: (pMkt: number | null) => void;
  setFee: (fee: number) => void;
  setCashout: (cashout: boolean) => void;
  setCashoutFee: (cashoutFee: number) => void;
  compute: () => void;
  reset: () => void;
  openCalculator: (params?: { marketId?: string; suggestedValue?: number; suggestedPUser?: number; pMkt?: number }) => void;
  closeCalculator: () => void;
}

// Save to localStorage for recall
const saveToStorage = (state: Partial<RewardCalcState>) => {
  try {
    const toSave = {
      value: state.value,
      pUser: state.pUser,
      fee: state.fee,
      cashout: state.cashout,
      cashoutFee: state.cashoutFee,
    };
    localStorage.setItem('rewardCalculator', JSON.stringify(toSave));
  } catch (e) {
    console.warn('Failed to save calculator state:', e);
  }
};

// Load from localStorage
const loadFromStorage = (): Partial<RewardCalcState> => {
  try {
    const saved = localStorage.getItem('rewardCalculator');
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
};

// Mathematical formulas as per prompt
const calculateResults = (state: RewardCalcState): RewardCalcResults => {
  const { value: V, pUser, pMkt, fee, cashout, cashoutFee } = state;
  
  // Prevent division by zero and invalid probabilities
  if (pUser <= 0 || pUser >= 1 || V <= 0) {
    return {
      retornoBruto: 0,
      recompensaLiquida: 0,
      roi: 0,
      pBreakeven: 0,
      desvio: pMkt ? pUser - pMkt : undefined,
    };
  }
  
  // Retorno bruto = V * (p_user / (1 - p_user))
  const retornoBruto = V * (pUser / (1 - pUser));
  
  // Taxa total = fee + (cashout ? cashout_fee : 0)
  const taxaTotal = fee + (cashout ? cashoutFee : 0);
  
  // Recompensa líquida = retorno_bruto * (1 - taxa_total)
  const recompensaLiquida = retornoBruto * (1 - taxaTotal);
  
  // ROI = (recompensa_liquida - V) / V
  const roi = (recompensaLiquida - V) / V;
  
  // Breakeven: probabilidade mínima para não perder
  // Simplificado: p onde recompensa_liquida = V
  // V * (p / (1-p)) * (1 - taxa_total) = V
  // (p / (1-p)) * (1 - taxa_total) = 1
  // p / (1-p) = 1 / (1 - taxa_total)
  // p = (1 - taxa_total) / (1 - taxa_total + 1 - taxa_total) = (1 - taxa_total) / (2 - 2*taxa_total)
  const pBreakeven = (1 - taxaTotal) / (2 - 2 * taxaTotal);
  
  // Desvio vs mercado
  const desvio = pMkt ? pUser - pMkt : undefined;
  
  return {
    retornoBruto,
    recompensaLiquida,
    roi,
    pBreakeven: Math.max(0, Math.min(1, pBreakeven)), // Clamp entre 0-1
    desvio,
  };
};

export const useRewardCalculator = create<RewardCalcState>((set, get) => {
  // Load initial state from localStorage
  const saved = loadFromStorage();
  
  const initialState = {
    value: saved.value || 100,
    pUser: saved.pUser || 0.5,
    pMkt: null,
    fee: saved.fee || 0.20,
    cashout: saved.cashout || false,
    cashoutFee: saved.cashoutFee || 0.02,
    results: {
      retornoBruto: 0,
      recompensaLiquida: 0,
      roi: 0,
      pBreakeven: 0,
    },
    isOpen: false,
    marketId: undefined,
  };
  
  // Calculate initial results
  initialState.results = calculateResults(initialState as RewardCalcState);
  
  return {
    ...initialState,
    
    setValue: (value: number) => {
      set((state) => {
        const newState = { ...state, value: Math.max(0, value) };
        newState.results = calculateResults(newState);
        saveToStorage(newState);
        
        // Analytics
        track('change_value', { value, marketId: state.marketId });
        
        return newState;
      });
    },
    
    setPUser: (pUser: number) => {
      set((state) => {
        const newState = { ...state, pUser: Math.max(0.01, Math.min(0.99, pUser)) };
        newState.results = calculateResults(newState);
        saveToStorage(newState);
        
        // Analytics
        track('change_p_user', { pUser, marketId: state.marketId });
        
        return newState;
      });
    },
    
    setPMkt: (pMkt: number | null) => {
      set((state) => {
        const newState = { ...state, pMkt: pMkt ? Math.max(0.01, Math.min(0.99, pMkt)) : null };
        newState.results = calculateResults(newState);
        
        // Analytics
        track('change_p_mkt', { pMkt, marketId: state.marketId });
        
        return newState;
      });
    },
    
    setFee: (fee: number) => {
      set((state) => {
        const newState = { ...state, fee: Math.max(0, Math.min(0.5, fee)) };
        newState.results = calculateResults(newState);
        saveToStorage(newState);
        
        // Analytics
        track('change_fee', { fee, marketId: state.marketId });
        
        return newState;
      });
    },
    
    setCashout: (cashout: boolean) => {
      set((state) => {
        const newState = { ...state, cashout };
        newState.results = calculateResults(newState);
        saveToStorage(newState);
        
        // Analytics
        track('toggle_cashout', { cashout, marketId: state.marketId });
        
        return newState;
      });
    },
    
    setCashoutFee: (cashoutFee: number) => {
      set((state) => {
        const newState = { ...state, cashoutFee: Math.max(0, Math.min(0.2, cashoutFee)) };
        newState.results = calculateResults(newState);
        saveToStorage(newState);
        
        return newState;
      });
    },
    
    compute: () => {
      set((state) => {
        const startTime = Date.now();
        const newState = { ...state };
        newState.results = calculateResults(newState);
        
        // Analytics
        const computeTime = Date.now() - startTime;
        track('compute_success', { 
          computeTime,
          roi: newState.results.roi,
          marketId: state.marketId,
        });
        
        return newState;
      });
    },
    
    reset: () => {
      set((state) => {
        const newState = {
          ...state,
          value: 100,
          pUser: 0.5,
          pMkt: null,
          fee: 0.20,
          cashout: false,
          cashoutFee: 0.02,
        };
        newState.results = calculateResults(newState);
        saveToStorage(newState);
        
        // Analytics
        track('reset_calculator', { marketId: state.marketId });
        
        return newState;
      });
    },
    
    openCalculator: (params = {}) => {
      set((state) => {
        const newState = {
          ...state,
          isOpen: true,
          marketId: params.marketId,
          value: params.suggestedValue || state.value,
          pUser: params.suggestedPUser || state.pUser,
          pMkt: params.pMkt || null,
        };
        newState.results = calculateResults(newState);
        
        // Analytics
        track('open_reward_calculator', { 
          marketId: params.marketId,
          suggestedValue: params.suggestedValue,
          suggestedPUser: params.suggestedPUser,
        });
        
        return newState;
      });
    },
    
    closeCalculator: () => {
      set((state) => ({ ...state, isOpen: false, marketId: undefined }));
    },
  };
});