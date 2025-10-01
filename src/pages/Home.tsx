import { useState, useEffect, useMemo } from 'react';
import { Filter, LogIn, UserPlus, BarChart3, Zap, Target, Shield, Sparkles, X, Landmark, Trophy, Rocket, Brain, Gamepad2, Globe } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MarketCardKalshi from '@/components/markets/MarketCardKalshi';
import hotFire from '@/assets/hot-fire.png';
import { FilterChips } from '@/components/ui/filter-chips';
import { MarketGridSkeleton } from '@/components/ui/MarketCardSkeleton';
import FAQ from '@/components/ui/FAQ';
import TopAnalysts from '@/components/ui/TopAnalysts';
import { useCategories } from '@/hooks/useCategories';
import { useMarkets } from '@/hooks/useMarkets';
import { groupMarketsByStatus } from '@/lib/market-utils';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { ComplianceBanner } from '@/components/compliance/ComplianceBanner';
import { OnboardingTrigger } from '@/components/onboarding/OnboardingTrigger';
import { track } from '@/lib/analytics';
import { Search, TrendingUp } from 'lucide-react';
import rioLogo from '@/assets/rio-white-logo-new.png';
import { cn } from '@/lib/utils';

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState('recentes');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(['active']);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Topic filters with modern Lucide icons
  const topicFilters = [
    { id: 'politics', label: 'Política', value: 'politica', Icon: Landmark },
    { id: 'economics', label: 'Economia', value: 'economia', Icon: Rocket },
    { id: 'sports', label: 'Esportes', value: 'esportes', Icon: Trophy },
    { id: 'tech', label: 'Tecnologia', value: 'tecnologia', Icon: Brain },
    { id: 'entertainment', label: 'Entretenimento', value: 'entretenimento', Icon: Gamepad2 },
    { id: 'climate', label: 'Clima', value: 'clima', Icon: Globe }
  ];

  // Status filters
  const statusFilters = [
    { id: 'active', label: 'Ativos', value: 'aberto' },
    { id: 'ending', label: 'Encerrando', value: 'encerrando' },
    { id: 'closed', label: 'Encerrados', value: 'fechado' }
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

  const getDaysUntilEnd = (endDate: string): number => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getMarketStatus = (market: any): string => {
    const daysLeft = getDaysUntilEnd(market.end_date);
    if (market.status !== 'aberto') return market.status;
    if (daysLeft <= 7) return 'encerrando';
    return 'aberto';
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
    
    // Filter by status
    const marketStatus = getMarketStatus(market);
    const matchesStatus = selectedStatus.length === 0 || 
           selectedStatus.some(statusId => {
             const status = statusFilters.find(s => s.id === statusId);
             return status && marketStatus === status.value;
           });
    
    return matchesSearch && matchesTopics && matchesStatus;
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

  // Handle status filter changes
  const handleStatusSelect = (statusId: string) => {
    setSelectedStatus(prev => 
      prev.includes(statusId) 
        ? prev.filter(id => id !== statusId)
        : [...prev, statusId]
    );
  };

  const handleRemoveStatus = (statusId: string) => {
    setSelectedStatus(prev => prev.filter(id => id !== statusId));
  };

  return (
    <div className="min-h-screen bg-bg-app pt-[env(safe-area-inset-top)] relative overflow-hidden">
      <div className="relative z-10">
      {/* Hero Section - Trading Aligned */}
      <section className="relative min-h-[42vh] md:min-h-[52vh] flex flex-col items-center justify-center bg-[color:var(--bg-app)] overflow-hidden">
        {/* Animated Background - Only in hero section */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#ff2389]/5 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/3 rounded-full blur-3xl animate-pulse-gentle" />
        </div>
        <div className="container mx-auto px-4 py-12 md:px-8 md:py-16 h-full flex flex-col justify-center relative z-10">
          
          <div className="text-center mb-6 md:mb-8">
            {/* Logo above mercados preditivos on mobile */}
            <div className="md:hidden mb-6 flex justify-center">
              <img 
                src={rioLogo} 
                alt="Rio Markets Logo" 
                className="h-8 w-auto"
              />
            </div>
            
            <h1 className="font-extrabold text-[34px] md:text-[44px] lg:text-[56px] leading-[1.05] mb-4 text-foreground [text-wrap:balance]">
              <TypewriterText 
                baseText="Mercados Preditivos"
                texts={["Inteligentes", "Lucrativos", "Rápidos"]}
                className="text-foreground md:hidden"
                mobileBreak={true}
                customColors={{ "Rápidos": "#ff2389" }}
              />
              <span className="hidden md:inline text-foreground">Mercados Preditivos </span>
              <TypewriterText 
                baseText=""
                texts={["Inteligentes", "Lucrativos", "Rápidos"]}
                className="text-primary hidden md:inline"
                customColors={{ "Rápidos": "#ff2389" }}
              />
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
              className="border-[#00FF91]/40 text-[#00FF91] hover:bg-[#00FF91]/10 h-12 px-8 text-base bg-secondary-glass"
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


      {/* Filters Section */}
      <div className="container mx-auto px-4 py-6 bg-gradient-to-b from-background/95 to-background/60 border-t border-border/30 backdrop-blur-sm">
        <div className="flex flex-col gap-6">
          {/* Topic Filters - Infinite Loop Side Scroller */}
          <div>
            <div className="relative overflow-visible py-4">
              {/* Fade overlays - lower z-index */}
              <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-[5] pointer-events-none"></div>
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-[5] pointer-events-none"></div>
              
              <div className="overflow-x-auto scrollbar-hide scroll-smooth relative z-[10]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex gap-4 pb-2 min-w-max animate-infinite-scroll hover:pause">
                  {/* First set of topics */}
                  {topicFilters.map((topic, index) => {
                    const isSelected = selectedTopics.includes(topic.id);
                    const IconComponent = topic.Icon;
                    const animationClass = `animate-rainbow-${(index % 6) + 1}`;
                    const delayClass = `animation-delay-${index * 100}`;
                    return (
                      <button
                        key={topic.id}
                        onClick={() => handleTopicSelect(topic.id)}
                        className={cn(
                          "flex items-center gap-3 px-6 py-4 rounded-xl text-base font-bold whitespace-nowrap relative",
                          "transition-all duration-300 hover:scale-105 hover:-translate-y-1 border-2 shadow-lg overflow-visible",
                          "animate-fade-in",
                          isSelected
                            ? 'bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-primary/30 scale-105 border-primary/50 animate-pulse-gentle z-[30]' 
                            : 'border-border/60 text-foreground hover:border-primary/60 hover:bg-primary/10 hover:shadow-primary/20 bg-card/90 backdrop-blur-sm hover:z-[20] z-[15]'
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {isSelected && (
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent animate-shimmer" />
                        )}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:rotate-12 hover:scale-110 relative overflow-hidden ${
                          isSelected ? 'bg-primary-foreground/20 animate-bounce' : 'animate-pulse'
                        }`}>
                          {!isSelected && (
                            <div className={`absolute inset-0 opacity-40 ${animationClass}`}></div>
                          )}
                          <IconComponent className={`w-6 h-6 relative z-10 ${!isSelected ? 'animate-pulse' : ''}`} />
                        </div>
                        <span className={`text-base relative z-10 ${!isSelected ? 'animate-fade-in' : ''}`}>{topic.label}</span>
                        {isSelected && (
                          <X 
                            className="w-5 h-5 ml-2 hover:scale-110 transition-transform relative z-10" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTopic(topic.id);
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                  {/* Duplicate set for infinite loop effect */}
                  {topicFilters.map((topic, index) => {
                    const isSelected = selectedTopics.includes(topic.id);
                    const IconComponent = topic.Icon;
                    const animationClass = `animate-rainbow-${(index % 6) + 1}`;
                    return (
                      <button
                        key={`${topic.id}-duplicate`}
                        onClick={() => handleTopicSelect(topic.id)}
                        className={cn(
                          "flex items-center gap-3 px-6 py-4 rounded-xl text-base font-bold whitespace-nowrap relative",
                          "transition-all duration-300 hover:scale-105 hover:-translate-y-1 border-2 shadow-lg overflow-visible",
                          "animate-fade-in",
                          isSelected
                            ? 'bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-primary/30 scale-105 border-primary/50 z-[30]' 
                            : 'border-border/60 text-foreground hover:border-primary/60 hover:bg-primary/10 hover:shadow-primary/20 bg-card/90 backdrop-blur-sm hover:z-[20] z-[15]'
                        )}
                        style={{ animationDelay: `${(index + topicFilters.length) * 50}ms` }}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:rotate-12 hover:scale-110 relative overflow-hidden ${
                          isSelected ? 'bg-primary-foreground/20 animate-bounce' : 'animate-pulse'
                        }`}>
                          {!isSelected && (
                            <div className={`absolute inset-0 opacity-40 ${animationClass}`}></div>
                          )}
                          <IconComponent className={`w-6 h-6 relative z-10 ${!isSelected ? 'animate-pulse' : ''}`} />
                        </div>
                        <span className={`text-base ${!isSelected ? 'animate-fade-in' : ''}`}>{topic.label}</span>
                        {isSelected && (
                          <X 
                            className="w-5 h-5 ml-2 hover:scale-110 transition-transform" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveTopic(topic.id);
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>
        
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 flex-wrap w-full">
            <h2 className="text-2xl font-bold text-foreground">Markets</h2>
            
            {/* Search Bar - Between Markets and Status Filter */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar mercados..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 bg-background/80 border-border/50 text-foreground placeholder:text-muted-foreground rounded-xl shadow-sm focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <FilterChips
              chips={statusFilters}
              selectedChips={selectedStatus}
              onChipSelect={handleStatusSelect}
              onRemoveChip={handleRemoveStatus}
              className="flex-shrink-0"
              chipClassName="px-2.5 py-1 text-xs"
            />
          </div>
        </div>

        {/* Markets Grid */}
        <div id="markets-section">
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
              <Button 
                onClick={() => navigate('/fast')}
                className="bg-[#ff2389] text-white hover:bg-[#ff2389]/90 animate-pulse"
              >
                <Zap className="w-4 h-4 mr-2" />
                Fast Markets
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-16 pb-[env(safe-area-inset-bottom)]">
            {sortedAndFilteredMarkets
              .filter((market, index, self) => 
                index === self.findIndex((m) => m.id === market.id)
              )
              .map((market, index) => {
                const isHighVolume = index < 3; // Top 3 markets get hot icon
                return (
                  <div key={`${market.id}-${index}`} className="relative">
                    <MarketCardKalshi
                      market={market} 
                      showHotIcon={isHighVolume}
                    />
                  </div>
                );
              })}
          </div>
        )}
        </div>
        
        {/* FAQ Section */}
        <FAQ />
        
        {/* Inline Compliance Banner */}
        <ComplianceBanner variant="inline" />
        
        <div className="pb-[env(safe-area-inset-bottom)]" />
      </div>
      </div>
    </div>
  );
};

export default Home;
