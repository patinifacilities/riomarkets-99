export interface User {
  id: string;
  nome: string;
  email: string;
  saldo_moeda: number;
  nivel: 'iniciante' | 'analista' | 'guru' | 'root';
  is_admin: boolean;
  created_at: string;
}

export type MarketType = 'binary' | 'three_way' | 'multi';

export interface Market {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  opcoes: string[];
  recompensas?: Record<string, number>; // preferido no app
  odds?: Record<string, number>;        // compatibilidade DB
  status: 'aberto' | 'fechado' | 'liquidado';
  end_date: string;
  created_at: string;
  thumbnail_url?: string;
  periodicidade?: string;
  destaque?: boolean;
  market_type?: MarketType;
}

export interface MarketOption {
  id: string;
  label: string;
  recompensa: number;
  totalBets: number;
}

export interface Order {
  id: string;
  user_id: string;
  market_id: string;
  opcao_escolhida: string;
  quantidade_moeda: number;
  preco: number;
  status: 'ativa' | 'ganha' | 'perdida' | 'cashout';
  created_at: string;
  cashout_amount?: number;
  cashed_out_at?: string;
  entry_multiple?: number;
  entry_percent?: number;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  tipo: 'credito' | 'debito';
  valor: number;
  descricao: string;
  created_at: string;
  market_id?: string;
}

export interface MarketResult {
  market_id: string;
  resultado_vencedor: string;
  data_liquidacao: string;
  tx_executada: boolean;
}

export interface MarketStats {
  vol_total: number;
  vol_24h: number;
  participantes: number;
}

export interface WatchlistItem {
  id: string;
  user_id: string;
  market_id: string;
  created_at: string;
}