export const topOptionsByChance = (
  options: Array<{ label: string; chance: number }>,
  limit: number = 2
) => {
  return options
    .sort((a, b) => b.chance - a.chance)
    .slice(0, limit);
};

export const getPlaceholderThumbnail = (categoria: string): string => {
  // Return appropriate icon based on category or default
  const categoryIcons: Record<string, string> = {
    'economia': '💰',
    'esportes': '⚽',
    'política': '🏛️',
    'clima': '🌤️',
    'tecnologia': '💻',
    'entretenimento': '🎬'
  };
  
  return categoryIcons[categoria] || '📊';
};

export const groupMarketsByStatus = (markets: Array<any>) => {
  const now = new Date();
  
  let ativos = 0;
  let encerrando = 0;
  let encerrados = 0;
  
  markets.forEach(market => {
    if (market.status === 'fechado' || market.status === 'liquidado') {
      encerrados++;
    } else if (market.status === 'aberto') {
      const endDate = new Date(market.end_date);
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft <= 0) {
        encerrando++;
      } else {
        ativos++;
      }
    }
  });
  
  return { ativos, encerrando, encerrados };
};