// Market trading hours utilities

export interface MarketStatus {
  isOpen: boolean;
  nextOpen?: Date;
  timeUntilOpen?: string;
  message?: string;
}

/**
 * Check if Nasdaq is currently open for trading
 * Trading hours: Monday-Friday, 9:30 AM - 4:00 PM ET (excluding holidays)
 */
export const getNasdaqStatus = (): MarketStatus => {
  const now = new Date();
  
  // Convert to ET (UTC-5 or UTC-4 depending on DST)
  const etOffset = isDST(now) ? -4 : -5;
  const etTime = new Date(now.getTime() + (etOffset * 60 * 60 * 1000));
  
  const dayOfWeek = etTime.getUTCDay();
  const hours = etTime.getUTCHours();
  const minutes = etTime.getUTCMinutes();
  const currentTimeInMinutes = hours * 60 + minutes;
  
  // Market closed on weekends
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    const nextMonday = getNextMonday(etTime);
    nextMonday.setUTCHours(9, 30, 0, 0);
    
    return {
      isOpen: false,
      nextOpen: nextMonday,
      timeUntilOpen: getTimeUntilOpen(now, nextMonday),
      message: 'Nasdaq fechada nos finais de semana'
    };
  }
  
  // Market hours: 9:30 AM - 4:00 PM ET (570 minutes to 960 minutes)
  const marketOpen = 9 * 60 + 30; // 9:30 AM
  const marketClose = 16 * 60; // 4:00 PM
  
  if (currentTimeInMinutes >= marketOpen && currentTimeInMinutes < marketClose) {
    return {
      isOpen: true,
      message: 'Nasdaq aberta para negociação'
    };
  }
  
  // Market closed - calculate next open time
  let nextOpen = new Date(etTime);
  
  if (currentTimeInMinutes >= marketClose) {
    // After market close, next open is tomorrow
    nextOpen.setUTCDate(nextOpen.getUTCDate() + 1);
    
    // Skip to Monday if tomorrow is Saturday
    if (nextOpen.getUTCDay() === 6) {
      nextOpen.setUTCDate(nextOpen.getUTCDate() + 2);
    }
    // Skip to Monday if tomorrow is Sunday
    else if (nextOpen.getUTCDay() === 0) {
      nextOpen.setUTCDate(nextOpen.getUTCDate() + 1);
    }
  }
  
  nextOpen.setUTCHours(9, 30, 0, 0);
  
  return {
    isOpen: false,
    nextOpen,
    timeUntilOpen: getTimeUntilOpen(now, nextOpen),
    message: 'Nasdaq fechada'
  };
};

/**
 * Check if Daylight Saving Time is in effect
 */
const isDST = (date: Date): boolean => {
  const january = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
  const july = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
  return Math.max(january, july) !== date.getTimezoneOffset();
};

/**
 * Get the next Monday from a given date
 */
const getNextMonday = (date: Date): Date => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + ((1 + 7 - result.getUTCDay()) % 7 || 7));
  return result;
};

/**
 * Calculate time until market opens
 */
const getTimeUntilOpen = (now: Date, nextOpen: Date): string => {
  const diff = nextOpen.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  
  return `${hours}h ${minutes}m`;
};

/**
 * Get commodity market status (24/7 for crypto-based commodities)
 */
export const getCommodityStatus = (): MarketStatus => {
  // Commodity markets are generally open 24/5 or 24/7 depending on the asset
  // For simplicity, we'll consider them always open
  return {
    isOpen: true,
    message: 'Mercado de commodities aberto'
  };
};

/**
 * Check if a specific asset category is tradeable
 */
export const isAssetTradeable = (category: string): MarketStatus => {
  switch (category.toLowerCase()) {
    case 'stocks':
    case 'ações':
      return getNasdaqStatus();
    case 'commodities':
    case 'crypto':
    case 'forex':
      return { isOpen: true };
    default:
      return { isOpen: true };
  }
};
