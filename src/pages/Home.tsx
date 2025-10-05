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
import { FastPoolSlide } from '@/components/fast/FastPoolSlide';
import { useRef } from 'react';
import logoWhite from '@/assets/rio-white-logo-deposit.png';
import { StarsBackground } from '@/components/ui/StarsBackground';

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
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const carouselApiRef = useRef<any>(null);
  const autoplayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
          // Load slide order with hidden state support (JSONB array)
          setSlideOrder(Array.isArray(data.slide_order) ? (data.slide_order as any[]) : []);
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

  // Build ordered slides - Only show what admin selected (Desktop only) - remove duplicates
  const orderedSlides = useMemo(() => {
    const slides: Array<{ type: 'market' | 'image' | 'fast' | 'text', data: any }> = [];
    const seenSlides = new Set<string>();
    
    if (slideOrder.length === 0) {
      // Fallback: show text card + selected markets + custom images
      slides.push({ type: 'text' as const, data: null });
      seenSlides.add('text-card');
      
      sliderMarkets.forEach(m => {
        if (!seenSlides.has(m.id)) {
          slides.push({ type: 'market' as const, data: m });
          seenSlides.add(m.id);
        }
      });
      
      sliderCustomImages.forEach(img => {
        if (!seenSlides.has(img.id)) {
          slides.push({ type: 'image' as const, data: img });
          seenSlides.add(img.id);
        }
      });
    } else {
      // Respect the order from admin panel
      slideOrder.forEach((item: any) => {
        const id = typeof item === 'string' ? item : item.id;
        
        // Skip hidden slides
        if (item.hidden) return;
        
        // Skip duplicates
        if (seenSlides.has(id)) return;
        seenSlides.add(id);
        
        if (id === 'text-card') {
          slides.push({ type: 'text' as const, data: null });
        } else if (id === 'fast-card') {
          slides.push({ type: 'fast' as const, data: null });
        } else if (id.startsWith('custom-')) {
          const img = sliderCustomImages.find(i => i.id === id);
          if (img) slides.push({ type: 'image' as const, data: img });
        } else {
          // Only show markets selected in "Mercados Selecionados"
          if (!sliderMarketIds.includes(id)) return;
          const market = sliderMarkets.find(m => m.id === id);
          if (market) slides.push({ type: 'market' as const, data: market });
        }
      });
    }
    
    return slides;
  }, [slideOrder, sliderMarkets, sliderCustomImages, sliderMarketIds]);

  // Handle slide click - restart autoplay after 5 seconds
  const handleSlideClick = () => {
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
    }
    
    autoplayTimeoutRef.current = setTimeout(() => {
      if (carouselApiRef.current) {
        carouselApiRef.current.plugins().autoplay?.play();
      }
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Carousel Section */}
      <div className="relative overflow-hidden border-b border-border">
        {/* Stars Background Effect */}
        <div className="absolute inset-0 opacity-30">
          <StarsBackground />
        </div>
        <div className="container mx-auto px-4 py-8 relative z-10">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            plugins={[
              Autoplay({
                delay: sliderDelay,
                stopOnInteraction: false,
              }),
            ]}
            className="w-full max-w-[1500px] mx-auto"
            setApi={(api) => {
              carouselApiRef.current = api;
              if (api) {
                api.on('select', () => {
                  setCurrentSlideIndex(api.selectedScrollSnap());
                });
              }
            }}
            onMouseEnter={handleSlideClick}
          >
            <CarouselContent className="py-4 md:py-8">

              {/* Mobile: Show ONLY text/buttons slide */}
              <CarouselItem key="text-card-mobile" className="md:hidden">
                <div className="flex items-center justify-center h-[280px] px-4">
                  <div className="text-center space-y-4 max-w-3xl mx-auto">
                    {/* Logo */}
                    <div className="flex justify-center mb-2">
                      <img 
                        src={logoWhite} 
                        alt="Logo" 
                        className="h-12 object-contain"
                      />
                    </div>
                    <div className="leading-tight">
                      <TypewriterText
                        baseText="Mercados Preditivos"
                        texts={[
                          "Lucrativos",
                          "Inteligentes",
                          "Rápidos"
                        ]}
                        customColors={{
                          "Rápidos": "#ff2389"
                        }}
                        className="text-3xl font-bold"
                        typingSpeed={100}
                        deletingSpeed={50}
                        pauseDuration={2000}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground max-w-2xl mx-auto px-4">
                      Ganhe recompensas compartilhando suas previsões sobre eventos futuros.
                    </p>
                    <div className="flex justify-center px-4 mt-3">
                      <OnboardingTrigger size="lg" variant="outline" className="w-auto px-6" />
                    </div>
                  </div>
                </div>
              </CarouselItem>

              {/* Desktop: Show slides or fallback to logo */}
              {orderedSlides.length > 0 ? (
                orderedSlides.map((slide, idx) => {
                if (slide.type === 'fast') {
                  // Fast pool slide - Hidden on mobile
                  return (
                    <CarouselItem key="fast-card" className="hidden md:block">
                      <div className="h-[400px]">
                        <FastPoolSlide onClick={handleSlideClick} />
                      </div>
                    </CarouselItem>
                  );
                }
                
                if (slide.type === 'text') {
                  // Text/Buttons card (same as first slide)
                  return (
                    <CarouselItem key="text-card" className="hidden md:block">
                      <div className="flex items-center justify-center h-[400px] px-4 sm:px-8">
                        <div className="text-center space-y-4 sm:space-y-6 max-w-3xl mx-auto">
                          <div className="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight">
                            <TypewriterText
                              baseText="Mercados Preditivos "
                              texts={[
                                "Lucrativos",
                                "Inteligentes",
                                "Rápidos"
                              ]}
                              customColors={{
                                "Rápidos": "#ff2389"
                              }}
                              className="text-3xl sm:text-4xl md:text-6xl font-bold"
                              typingSpeed={100}
                              deletingSpeed={50}
                              pauseDuration={2000}
                              mobileBreak={false}
                            />
                          </div>
                          <p className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                            Ganhe recompensas compartilhando suas previsões sobre eventos futuros.
                          </p>
                          <div className="flex justify-center items-center px-4">
                            <OnboardingTrigger size="lg" variant="outline" className="w-full md:w-auto px-6" />
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  );
                }
                
                if (slide.type === 'image') {
                  // Custom image slide - Hidden on mobile
                  const img = slide.data;
                  return (
                    <CarouselItem key={img.id} className="hidden md:block">
                      <div 
                        className="relative h-[400px] w-full overflow-hidden rounded-2xl cursor-pointer"
                        onClick={handleSlideClick}
                      >
                        <img 
                          src={img.url} 
                          alt={img.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-8 left-8">
                          <h2 className="text-4xl md:text-5xl font-bold text-white">
                            {img.title}
                          </h2>
                        </div>
                      </div>
                    </CarouselItem>
                  );
                }
                
                // Market slide - Hidden on mobile
                const market = slide.data;
                
                return (
                  <CarouselItem key={market.id} className="hidden md:block">
                    <div 
                      className="relative h-[400px] w-full overflow-hidden rounded-2xl cursor-pointer"
                      onClick={() => {
                        handleSlideClick();
                        navigate(`/market/${market.id}`);
                      }}
                    >
                      {/* Background Image with Clean Fade/Shadow Effect */}
                      <div className="absolute inset-0">
                        {market.imagem_url || market.thumbnail_url || market.image_url || market.photo_url ? (
                          <>
                            <img 
                              src={market.imagem_url || market.thumbnail_url || market.image_url || market.photo_url} 
                              alt={market.titulo}
                              className="w-full h-full object-cover"
                            />
                            {/* Clean gradient overlay - more on left, less on right */}
                            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-black/20" />
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background to-primary/10" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="relative h-full flex items-center px-4 md:px-12 py-6 md:py-0">
                        <div className="flex flex-col md:flex-row items-center justify-between w-full gap-6 md:gap-8">
                          {/* Left side - Market info */}
                          <div className="flex-1 w-full md:max-w-2xl space-y-4 md:space-y-6 text-center md:text-left">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight line-clamp-3">
                              {market.titulo}
                            </h2>
                            
                            {/* Stats */}
                            <div className="flex items-center gap-3 md:gap-4 justify-center md:justify-start text-white/90">
                              <div className="flex items-center -space-x-2">
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSlideClick();
                                navigate(`/mercado/${market.id}`);
                              }}
                              className="bg-white text-black hover:bg-white/90 font-semibold px-8 py-6 rounded-full text-lg transition-all hover:scale-105 shadow-xl"
                            >
                              <Sparkles className="w-5 h-5 mr-2" />
                              Analisar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                );
              })
              ) : (
                <CarouselItem className="hidden md:block">
                  <div className="flex items-center justify-center h-[400px] rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
                    <img 
                      src={logoWhite} 
                      alt="Logo"
                      className="max-w-[300px] max-h-[200px] object-contain opacity-50"
                    />
                  </div>
                </CarouselItem>
              )}
            </CarouselContent>
            
            <CarouselPrevious className="hidden" />
            <CarouselNext className="hidden" />
            
            {/* Dots Navigation - Desktop only - only show if there are slides */}
            {orderedSlides.length > 0 && (
              <div className="hidden md:flex justify-center gap-2 mt-4">
                {/* +1 for intro slide, then all ordered slides */}
                {[...Array(orderedSlides.length + 1)].map((_, index) => (
                <button
                  key={index}
                  className={cn(
                    "h-2 rounded-full transition-all cursor-pointer",
                    currentSlideIndex === index 
                      ? "w-8 bg-white" 
                      : "w-2 bg-white/30 hover:bg-white/60"
                  )}
                  onClick={() => {
                    if (carouselApiRef.current) {
                      carouselApiRef.current.scrollTo(index);
                    }
                  }}
                  aria-label={`Ir para slide ${index + 1}`}
                />
              ))}
              </div>
            )}
          </Carousel>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters - Improved for white mode */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center">
          <div className="group relative flex-1 max-w-md w-full sm:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/70 group-hover:text-primary transition-colors duration-300 z-10" strokeWidth={2.5} />
            <Input
              placeholder="Pesquisar Mercados"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 bg-gradient-to-r from-card/70 to-card/50 dark:from-card/60 dark:to-card/40 border border-white/10 hover:border-white/20 dark:border-border/40 dark:hover:border-border/60 text-foreground placeholder:text-muted-foreground/60 rounded-2xl shadow-lg hover:shadow-xl backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] focus-within:border-primary/50 focus-within:shadow-primary/20"
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>
          
          {/* Filter Pills - on same line for desktop */}
          <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide w-full sm:w-auto sm:flex-1">
            <button
              onClick={() => handleSortChange('recentes')}
              className={cn(
                "px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2",
                sortBy === 'recentes'
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card/80 dark:bg-card/50 text-muted-foreground hover:text-foreground border border-border/40 backdrop-blur-sm"
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
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card/80 dark:bg-card/50 text-muted-foreground hover:text-foreground border border-border/40 backdrop-blur-sm"
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
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card/80 dark:bg-card/50 text-muted-foreground hover:text-foreground border border-border/40 backdrop-blur-sm"
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
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card/80 dark:bg-card/50 text-muted-foreground hover:text-foreground border border-border/40 backdrop-blur-sm"
              )}
            >
              Ending
            </button>
            
            <Select value={selectedStatus[0] || 'active'} onValueChange={(val) => setSelectedStatus([val])}>
              <SelectTrigger className="w-[120px] bg-card/80 dark:bg-card/50 border-border/40 text-foreground backdrop-blur-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
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
            {sortedAndFilteredMarkets.map((market, index) => (
              <MarketCardKalshi 
                key={market.id} 
                market={market} 
                showHotIcon={index < 3}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
