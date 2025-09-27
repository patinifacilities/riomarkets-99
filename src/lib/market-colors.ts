import { Market } from "@/types";

export type MarketOptionVariant = "yes" | "no" | "draw" | "neutral";

/**
 * Get the appropriate color variant for a market option based on position and market type
 */
export function getOptionVariant(
  market: Market, 
  optionIndex: number, 
  optionLabel?: string
): MarketOptionVariant {
  const marketType = market.market_type || 'binary';
  const normalizedLabel = optionLabel?.toLowerCase();

  // Handle three-way markets
  if (marketType === 'three_way') {
    // Check for "empate" or "draw" keywords first
    if (normalizedLabel?.includes('empate') || normalizedLabel?.includes('draw')) {
      return 'draw';
    }
    
    // Position-based mapping for three-way
    switch (optionIndex) {
      case 0: return 'yes';   // First option (Team A/Yes)
      case 1: return 'draw';  // Middle option (Draw/Tie)  
      case 2: return 'no';    // Last option (Team B/No)
      default: return 'neutral';
    }
  }

  // Handle binary markets
  if (marketType === 'binary') {
    if (normalizedLabel?.includes('sim') || normalizedLabel?.includes('yes')) {
      return 'yes';
    }
    if (normalizedLabel?.includes('não') || normalizedLabel?.includes('no')) {
      return 'no';
    }
    
    // Fallback to position for binary
    return optionIndex === 0 ? 'yes' : 'no';
  }

  // Multi-option markets - use neutral for most, yes for first
  return optionIndex === 0 ? 'yes' : 'neutral';
}

/**
 * Determine if market should render as binary layout (2 buttons side by side)
 */
export function isBinaryLayout(market: Market): boolean {
  return market.market_type === 'binary' || 
         (market.opcoes?.length === 2 && market.market_type !== 'three_way');
}

/**
 * Determine if market should render as three-way layout (3 buttons)
 */
export function isThreeWayLayout(market: Market): boolean {
  return market.market_type === 'three_way' && market.opcoes?.length === 3;
}

/**
 * Get aria-label for option button
 */
export function getOptionAriaLabel(optionLabel: string): string {
  return `Analisar em ${optionLabel}`;
}