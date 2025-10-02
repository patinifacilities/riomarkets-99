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
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/10 to-background border-b border-border">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Mercados Preditivos de Notícias do Brasil
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Aposte em suas opiniões sobre política, economia, esportes e muito mais. 
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
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/auth')}
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Criar Conta
              </Button>
            </div>
          </div>
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
