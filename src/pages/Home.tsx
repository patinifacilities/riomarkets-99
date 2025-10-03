import { useState, useEffect, useMemo } from 'react';
import { Filter, LogIn, UserPlus, BarChart3, Zap, Target, Shield, Sparkles, X, Landmark, Trophy, Rocket, Brain, Gamepad2, Globe } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MarketCardKalshi from '@/components/markets/MarketCardKalshi';
import { MarketGridSkeleton } from '@/components/ui/MarketCardSkeleton';
import { useMarkets } from '@/hooks/useMarkets';
import { track } from '@/lib/analytics';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { OnboardingTrigger } from '@/components/onboarding/OnboardingTrigger';
import ProbabilityChart from '@/components/markets/ProbabilityChart';
import { supabase } from '@/integrations/supabase/client';

interface CustomImage {
  id: string;
  url: string;
  title: string;
}

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState('recentes');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(['active']);
  const [sliderMarketIds, setSliderMarketIds] = useState<string[]>([]);
  const [sliderCustomImages, setSliderCustomImages] = useState<CustomImage[]>([]);
  const [sliderDelay, setSliderDelay] = useState(7000);
  const [slideOrder, setSlideOrder] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Load slider configuration
  useEffect(() => {
    const loadSliderConfig = async () => {
      try {
        const { data, error } = await supabase
          .from('slider_config')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setSliderMarketIds(Array.isArray(data.selected_market_ids) ? data.selected_market_ids : []);
          const customImgs = Array.isArray(data.custom_images) 
            ? (data.custom_images as unknown as CustomImage[])
            : [];
          setSliderCustomImages(customImgs);
          setSliderDelay((data.slider_delay_seconds || 7) * 1000);
          setSlideOrder(Array.isArray(data.slide_order) ? (data.slide_order as string[]) : []);
        }
      } catch (error) {
        console.error('Error loading slider config:', error);
      }
    };

    loadSliderConfig();
  }, []);
  
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
        result = result.sort((a, b) => (b.opcoes?.length || 0) - (a.opcoes?.length || 0));
        break;
      case 'liquidez':
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

  // Get markets for slider based on admin configuration
  const sliderMarkets = useMemo(() => {
    if (sliderMarketIds.length === 0) {
      // Fallback to top 3 if no config
      return [...markets]
        .sort((a, b) => b.id.localeCompare(a.id))
        .slice(0, 3);
    }
    
    // Filter markets based on selected IDs, preserving order
    return sliderMarketIds
      .map(id => markets.find(m => m.id === id))
      .filter((m): m is NonNullable<typeof m> => m !== undefined);
  }, [markets, sliderMarketIds]);

  // Build ordered slides
  const orderedSlides = useMemo(() => {
    if (slideOrder.length === 0) {
      return sliderMarkets.map(m => ({ type: 'market' as const, data: m }));
    }

    return slideOrder
      .map(id => {
        if (id.startsWith('custom-')) {
          const img = sliderCustomImages.find(i => i.id === id);
          return img ? { type: 'image' as const, data: img } : null;
        } else {
          const market = markets.find(m => m.id === id);
          return market ? { type: 'market' as const, data: market } : null;
        }
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [slideOrder, markets, sliderMarkets, sliderCustomImages]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Carousel Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background border-b border-border">
        <div className="container mx-auto px-4 py-8">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: sliderDelay,
                stopOnInteraction: false,
                stopOnMouseEnter: false,
              }),
            ]}
            className="w-full max-w-7xl mx-auto"
          >
            <CarouselContent className="py-8">
              {/* Slide 1: Title with Typewriter */}
              <CarouselItem>
                <div className="text-center space-y-6 py-12 px-8">
                  <div className="text-4xl md:text-6xl font-bold">
                    <div className="mb-4">Mercados Preditivos</div>
                    <TypewriterText
                      baseText=""
                      texts={[
                        "para Análise Estratégica",
                        "baseados em Dados",
                        "com Transparência Total",
                        "Rápidos"
                      ]}
                      customColors={{
                        "Rápidos": "#ff2389"
                      }}
                      className="text-4xl md:text-6xl font-bold"
                      typingSpeed={100}
                      deletingSpeed={50}
                      pauseDuration={2000}
                    />
                  </div>
                  <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                    Ganhe recompensas compartilhando suas previsões sobre eventos futuros.
                  </p>
                  <div className="flex gap-4 justify-center items-center pt-4">
                    <Button 
                      size="lg" 
                      className="bg-[#00ff90] text-gray-900 hover:bg-[#00ff90]/90 font-semibold px-8 transition-all hover:scale-105"
                      onClick={() => navigate('/auth')}
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      Explorar Mercados
                    </Button>
                    <OnboardingTrigger size="lg" variant="outline" />
                  </div>
                </div>
              </CarouselItem>

              {/* Ordered Slides - Markets and Custom Images */}
              {orderedSlides.map((slide, idx) => {
                if (slide.type === 'image') {
                  // Custom image slide
                  const img = slide.data;
                  return (
                    <CarouselItem key={img.id}>
                      <div className="relative h-[500px] w-full overflow-hidden rounded-2xl">
                        <img 
                          src={img.url} 
                          alt={img.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                        <div className="absolute bottom-8 left-8">
                          <h2 className="text-4xl md:text-5xl font-bold text-white">
                            {img.title}
                          </h2>
                        </div>
                      </div>
                    </CarouselItem>
                  );
                }
                
                // Market slide
                const market = slide.data;
                const yesOption = market.opcoes?.find((opt: any) => opt.toLowerCase().includes('sim') || opt.toLowerCase().includes('yes'));
                const noOption = market.opcoes?.find((opt: any) => opt.toLowerCase().includes('não') || opt.toLowerCase().includes('no'));
                
                // Calculate probabilities (mock for now)
                const yesProb = 50 + Math.random() * 40;
                const noProb = 100 - yesProb;
                
                return (
                  <CarouselItem key={market.id}>
                    <div className="relative h-[500px] w-full overflow-hidden rounded-2xl">
                      {/* Background Image with Overlay */}
                      <div className="absolute inset-0">
                        {market.imagem_url || market.thumbnail_url || market.image_url || market.photo_url ? (
                          <img 
                            src={market.imagem_url || market.thumbnail_url || market.image_url || market.photo_url} 
                            alt={market.titulo}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background to-primary/10" />
                        )}
                        {/* Dark overlay for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
                      </div>
                      
                      {/* Content */}
                      <div className="relative h-full flex items-center px-12">
                        <div className="flex items-center justify-between w-full gap-8">
                          {/* Left side - Market info */}
                          <div className="flex-1 max-w-2xl space-y-6">
                            {/* Market icon */}
                            <div className="w-16 h-16 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center overflow-hidden">
                              {market.imagem_url || market.thumbnail_url ? (
                                <img 
                                  src={market.imagem_url || market.thumbnail_url} 
                                  alt={market.titulo}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-2xl">📊</span>
                              )}
                            </div>
                            
                            {/* Title */}
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                              {market.titulo}
                            </h2>
                            
                            {/* Options with probabilities */}
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#00ff90]/20 border border-[#00ff90]/40 backdrop-blur-sm">
                                <div className="w-2 h-2 rounded-full bg-[#00ff90]" />
                                <span className="text-white font-medium">≥ {yesOption || 'SIM'} {yesProb.toFixed(1)}%</span>
                              </div>
                              
                              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff2389]/20 border border-[#ff2389]/40 backdrop-blur-sm">
                                <div className="w-2 h-2 rounded-full bg-[#ff2389]" />
                                <span className="text-white font-medium">≤ {noOption || 'NÃO'} {noProb.toFixed(1)}%</span>
                              </div>
                              
                              {/* Profile icons with gradient */}
                              <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                                <div 
                                  className="w-6 h-6 rounded-full border-2 border-white"
                                  style={{ background: 'linear-gradient(135deg, #00ff90 0%, #ff2389 100%)' }}
                                />
                                <div 
                                  className="w-6 h-6 rounded-full border-2 border-white -ml-2"
                                  style={{ background: 'linear-gradient(135deg, #ff2389 0%, #00ff90 100%)' }}
                                />
                                <span className="text-white text-sm ml-1">+{Math.floor(Math.random() * 5000) + 1000}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Right side - Predict button */}
                          <div className="flex items-center justify-center">
                            <Button
                              size="lg"
                              onClick={() => navigate(`/mercado/${market.id}`)}
                              className="bg-white text-black hover:bg-white/90 font-semibold px-8 py-6 rounded-full text-lg transition-all hover:scale-105 shadow-xl"
                            >
                              <Sparkles className="w-5 h-5 mr-2" />
                              Predict
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            
            <CarouselPrevious className="hidden" />
            <CarouselNext className="hidden" />
            
            {/* Dots Navigation */}
            <div className="flex justify-center gap-2 mt-4">
              {[0, 1, 2, 3].map((index) => (
                <button
                  key={index}
                  className="w-2 h-2 rounded-full bg-white/30 hover:bg-white/60 transition-all cursor-pointer"
                  onClick={(e) => {
                    const carousel = e.currentTarget.closest('[data-carousel-container]');
                    if (carousel) {
                      const api = (carousel as any).__embla__;
                      if (api) api.scrollTo(index);
                    }
                  }}
                  aria-label={`Ir para slide ${index + 1}`}
                />
              ))}
            </div>
          </Carousel>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Input
              placeholder="Search markets"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 rounded-xl"
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => handleSortChange('recentes')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2",
              sortBy === 'recentes'
                ? "bg-white text-black"
                : "bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#2a2a2a]"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            Newest
          </button>
          
          <button
            onClick={() => handleSortChange('populares')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2",
              sortBy === 'populares'
                ? "bg-white text-black"
                : "bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#2a2a2a]"
            )}
          >
            <Zap className="w-4 h-4" />
            Trending
          </button>
          
          <button
            onClick={() => handleSortChange('liquidez')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2",
              sortBy === 'liquidez'
                ? "bg-white text-black"
                : "bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#2a2a2a]"
            )}
          >
            <Target className="w-4 h-4" />
            Volume
          </button>
          
          <button
            onClick={() => handleSortChange('prazo')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
              sortBy === 'prazo'
                ? "bg-white text-black"
                : "bg-[#1a1a1a] text-gray-400 hover:text-white border border-[#2a2a2a]"
            )}
          >
            Ending
          </button>
          
          <Select value={selectedStatus[0] || 'active'} onValueChange={(val) => setSelectedStatus([val])}>
            <SelectTrigger className="w-[120px] bg-[#1a1a1a] border-[#2a2a2a] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
              <SelectItem value="active">Open</SelectItem>
              <SelectItem value="ending">Ending</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value="all">
            <SelectTrigger className="w-[140px] bg-[#1a1a1a] border-[#2a2a2a] text-white">
              <SelectValue placeholder="All Tokens" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
              <SelectItem value="all">All Tokens</SelectItem>
              <SelectItem value="rioz">RIOZ</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Markets Grid */}
        {isLoading ? (
          <MarketGridSkeleton />
        ) : sortedAndFilteredMarkets.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              Nenhum mercado encontrado.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedAndFilteredMarkets.map((market) => (
              <MarketCardKalshi key={market.id} market={market} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
