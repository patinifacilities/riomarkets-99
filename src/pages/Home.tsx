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

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
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

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Hero */}
      <div className="border-b border-border/40">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl">
            <h1 className="text-3xl md:text-5xl font-bold mb-3 text-foreground">
              Mercados de Predição
            </h1>
            <p className="text-lg text-muted-foreground">
              Aposte em eventos futuros. Ganhe em <span className="text-primary font-semibold">RIOZ</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Filters Bar */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Search and Sort */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar mercados..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-card/50 border-border/60 focus:border-primary/60"
              />
            </div>
            
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px] bg-card/50 border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recentes">Mais Recentes</SelectItem>
                <SelectItem value="populares">Mais Populares</SelectItem>
                <SelectItem value="liquidez">Maior Liquidez</SelectItem>
                <SelectItem value="prazo">Encerrando Primeiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Topic Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {topicFilters.map((topic) => {
              const isSelected = selectedTopics.includes(topic.id);
              const IconComponent = topic.Icon;
              return (
                <button
                  key={topic.id}
                  onClick={() => handleTopicSelect(topic.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-card/50 hover:bg-card border border-border/60 hover:border-primary/40"
                  )}
                >
                  <IconComponent className="w-4 h-4" />
                  {topic.label}
                  {isSelected && (
                    <X 
                      className="w-3 h-3" 
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

          {/* Status Filters */}
          <div className="flex gap-2">
            {statusFilters.map(filter => (
              <button
                key={filter.id}
                onClick={() => handleStatusSelect(filter.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  selectedStatus.includes(filter.id)
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "bg-card/30 hover:bg-card/50 text-muted-foreground border border-border/40"
                )}
              >
                {filter.label}
              </button>
            ))}
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
