import { Market } from '@/types';

/**
 * Adapter para compatibilidade entre odds (DB) e recompensas (UI)
 * Mantém compatibilidade total com o banco atual
 */

export type RecompensasMap = Record<string, number>;

export interface MarketWithRecompensas extends Omit<Market, 'recompensas'> {
  recompensas: RecompensasMap;
  odds?: RecompensasMap; // compatibilidade DB
}

/**
 * Converte dados do DB para formato do app
 */
export function adaptMarketFromDB(dbMarket: any): MarketWithRecompensas {
  const recompensas = dbMarket.recompensas ?? dbMarket.odds ?? {};
  
  return {
    ...dbMarket,
    recompensas,
    odds: dbMarket.odds, // preserva original para compatibilidade
  };
}

/**
 * Converte dados do app para formato do DB
 */
export function adaptMarketToDB(market: MarketWithRecompensas): any {
  return {
    ...market,
    odds: market.recompensas, // escreve recompensas na coluna odds
    recompensas: market.recompensas, // mantém ambos durante transição
  };
}

/**
 * Extrai recompensas de um market (com fallback seguro)
 */
export function getMarketRecompensas(market: Market): RecompensasMap {
  return market.recompensas ?? (market as any).odds ?? {};
}

/**
 * Valida se as recompensas são válidas
 */
export function validateRecompensas(recompensas: RecompensasMap): boolean {
  if (!recompensas || typeof recompensas !== 'object') return false;
  
  return Object.values(recompensas).every(
    value => typeof value === 'number' && value > 0
  );
}