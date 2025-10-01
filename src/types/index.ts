export interface User {
  id: string;
  nome: string;
  email: string;
  saldo_moeda: number;
  nivel: 'iniciante' | 'analista' | 'guru' | 'root';
  is_admin: boolean;
  is_blocked?: boolean;
  created_at: string;
  profile_pic_url?: string;
}

export interface Profile {
  id: string;
  nome: string;
  email: string;
  username?: string;
  cpf?: string;
  saldo_moeda: number;
  nivel: 'iniciante' | 'analista' | 'guru' | 'root';
  is_admin: boolean;
  is_blocked?: boolean;
  profile_pic_url?: string;
  created_at: string;
  updated_at: string;
}

export type MarketType = 'binary' | 'three_way' | 'multi';

export interface Market {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  opcoes: string[];
  odds?: Record<string, number>; // Real odds from database
  status: 'aberto' | 'fechado' | 'liquidado';
  end_date: string;
  created_at: string;
  thumbnail_url?: string;
  periodicidade?: string;
  destaque?: boolean;
  market_type?: MarketType;
  icon_url?: string;
  photo_url?: string;
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