import { useState, useEffect, useMemo } from 'react';
import { Search, TrendingUp, Filter } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MarketCardKalshi from '@/components/markets/MarketCardKalshi';
import FilterToolbar from '@/components/ui/FilterToolbar';
import { FilterChips } from '@/components/ui/filter-chips';
import { MarketGridSkeleton } from '@/components/ui/MarketCardSkeleton';
import TopAnalysts from '@/components/ui/TopAnalysts';
import { useMarkets } from '@/hooks/useMarkets';
import { groupMarketsByStatus } from '@/lib/market-utils';
import { track } from '@/lib/analytics';
import FAQ from '@/components/ui/FAQ';
import { ComplianceBanner } from '@/components/compliance/ComplianceBanner';
import { OnboardingTrigger } from '@/components/onboarding/OnboardingTrigger';

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState('recentes');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Topic filters similar to Kalshi
  const topicFilters = [
    { id: 'politics', label: 'Política', value: 'politica' },
    { id: 'economics', label: 'Economia', value: 'economia' },
    { id: 'sports', label: 'Esportes', value: 'esportes' },
    { id: 'tech', label: 'Tecnologia', value: 'tecnologia' },
    { id: 'entertainment', label: 'Entretenimento', value: 'entretenimento' },
    { id: 'climate', label: 'Clima', value: 'clima' }
  ];
  
  const { data: markets = [], isLoading } = useMarkets(selectedCategory);

  // Read initial category from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoria = params.get('categoria') || 'all';
    setSelectedCategory(categoria);
  }, [location.search]);

  // Handle category change and update URL
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const params = new URLSearchParams(location.search);
    
    if (categoryId === 'all') {
      params.delete('categoria');
    } else {
      params.set('categoria', categoryId);
    }
    
    navigate({ search: params.toString() }, { replace: true });
  };

  const filteredMarkets = markets.filter(market => {
    // Filter by search term
    const matchesSearch = market.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
           market.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by topics
    const matchesTopics = selectedTopics.length === 0 || 
           selectedTopics.some(topicId => {
             const topic = topicFilters.find(t => t.id === topicId);
             return topic && market.categoria === topic.value;
           });
    
    return matchesSearch && matchesTopics;
  });

  // Função de ordenação
  const sortedAndFilteredMarkets = useMemo(() => {
    let result = [...filteredMarkets];
    
    switch (sortBy) {
      case 'populares':
        // Ordenar por popularidade (usando quantidade de opções como proxy)
        result = result.sort((a, b) => (b.opcoes?.length || 0) - (a.opcoes?.length || 0));
        break;
      case 'liquidez':
        // Ordenar por liquidez (usando ID como proxy para volume por enquanto)
        result = result.sort((a, b) => b.id.localeCompare(a.id));
        break;
      case 'prazo':
        result = result.sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime());
        break;
      default: // recentes
        result = result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    
    return result;
  }, [filteredMarkets, sortBy]);

  const { ativos, encerrando, encerrados } = groupMarketsByStatus(sortedAndFilteredMarkets);

  // Handle sort change
  const handleSortChange = (value: string) => {
    track('sort_change', { sort_type: value, previous_sort: sortBy });
    setSortBy(value);
  };

  // Handle topic filter changes
  const handleTopicSelect = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const handleRemoveTopic = (topicId: string) => {
    setSelectedTopics(prev => prev.filter(id => id !== topicId));
  };

  return (
    <div className="min-h-screen bg-bg-app pt-[env(safe-area-inset-top)]">
      {/* Hero Section - Trading Aligned */}
      <section className="relative min-h-[42vh] md:min-h-[52vh] flex flex-col items-center justify-center bg-[color:var(--bg-app)]">
        <div className="container mx-auto px-4 py-12 md:px-8 md:py-16 h-full flex flex-col justify-center relative z-10">
          <div className="text-center mb-6 md:mb-8">
            <h1 className="font-extrabold text-[34px] md:text-[44px] lg:text-[56px] leading-[1.05] mb-4 text-white [text-wrap:balance]">
              Mercados Preditivos <span id="typewriter-text" className="text-[#00FF91]">Inteligentes</span>
            </h1>
            <p className="text-base md:text-lg max-w-[60ch] mx-auto text-[color:var(--text-secondary)]">
              Analise eventos futuros com dados preditivos inteligentes. Teste suas habilidades e suba no ranking em <span className="text-[#00FF91]">Rioz Coin</span>.
            </p>
          </div>

          {/* CTAs duplos */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-6 md:mt-8">
            <Button 
              className="bg-[#00FF91] text-black hover:brightness-110 h-12 px-8 text-base font-semibold"
              onClick={() => {
                track('hero_cta_click', { cta_type: 'explore_markets' });
                document.getElementById('markets-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explorar mercados
            </Button>
            <OnboardingTrigger 
              variant="outline" 
              size="lg"
              className="border-[#00FF91]/40 text-[#00FF91] hover:bg-[#00FF91]/10 h-12 px-8 text-base"
            >
              Como funciona
            </OnboardingTrigger>
          </div>

          {/* Strip de confiança */}
          <div className="flex flex-wrap justify-center items-center gap-6 mt-8 text-sm text-[color:var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00FF91]"></div>
              <span>Alta Liquidez</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00FF91]"></div>
              <span>100% Legalizado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00FF91]"></div>
              <span>Você no Controle</span>
              </div>
            </div>
            
          </div>
        </section>

      {/* Filter Toolbar */}
      <FilterToolbar 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        sortBy={sortBy}
        onSortChange={handleSortChange}
      />

      {/* Topic Filters */}
      <div className="container mx-auto px-4 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filtrar por tópico:</span>
        </div>
        <FilterChips
          chips={topicFilters}
          selectedChips={selectedTopics}
          onChipSelect={handleTopicSelect}
          onRemoveChip={handleRemoveTopic}
        />
      </div>

      {/* Markets Grid */}
      <div id="markets-section" className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[color:var(--text-primary)] flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#00FF91]" />
            Mercados ativos
          </h2>
          
          {/* Status Counters */}
          <div className="flex flex-wrap gap-6 items-center mt-2 text-sm md:text-base">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00FF91]"></div>
              <span className="text-[#00FF91] font-medium">{ativos} ativos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#E8B100]"></div>
              <span className="text-[#E8B100] font-medium">{encerrando} encerrando</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#6B7280]"></div>
              <span className="text-[#6B7280] font-medium">{encerrados} encerrados</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <MarketGridSkeleton />
        ) : sortedAndFilteredMarkets.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#00FF91]/10 to-[#FF1493]/10 border-2 border-[#00FF91]/20 flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-[#00FF91]" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-[color:var(--text-primary)]">
              {selectedCategory === 'all' 
                ? 'Nenhum mercado encontrado'
                : `Nenhum mercado encontrado para esta categoria`
              }
            </h3>
            <p className="text-[color:var(--text-secondary)] mb-6 max-w-md mx-auto">
              {selectedCategory === 'all' 
                ? 'Tente ajustar seus filtros de busca ou explore nossas categorias populares'
                : 'Tente outra categoria ou salve sua busca para ser notificado sobre novos mercados'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {selectedCategory !== 'all' && (
                <Button
                  onClick={() => handleCategoryChange('all')}
                  className="bg-[#00FF91] text-black hover:brightness-110"
                >
                  Ver todos os mercados
                </Button>
              )}
              <Button variant="outline" className="border-[#00FF91]/40 text-[#00FF91]">
                Salvar busca
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-16 pb-[env(safe-area-inset-bottom)]">
            {sortedAndFilteredMarkets.map(market => (
              <MarketCardKalshi key={market.id} market={market} />
            ))}
          </div>
        )}
      </div>
      
        {/* Top Analysts Section */}
        <TopAnalysts />
        
        {/* FAQ Section */}
        <FAQ />
        
        {/* Inline Compliance Banner */}
        <ComplianceBanner variant="inline" />
        
        {/* Compliance Banner - Inline variant */}
        <ComplianceBanner variant="inline" />
      
      <div className="pb-[env(safe-area-inset-bottom)]" />
    </div>
  );
};

export default Home;