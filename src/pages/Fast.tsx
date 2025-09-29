import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Zap, Clock, BarChart3 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const Fast = () => {
  const [countdown, setCountdown] = useState(60);
  const [currentRound, setCurrentRound] = useState(1);

  // Categories/themes for the fast pools
  const categories = [
    { id: 'crypto', name: 'Cripto', icon: '₿' },
    { id: 'commodities', name: 'Commodities', icon: '🛢️' },
    { id: 'forex', name: 'Forex', icon: '💱' },
    { id: 'stocks', name: 'Ações', icon: '📈' }
  ];

  const [selectedCategory, setSelectedCategory] = useState('commodities');

  // Sample pools based on category
  const pools = {
    commodities: [
      { 
        id: 1, 
        question: 'O Petróleo vai subir nos próximos 60 segundos?', 
        asset: 'Petróleo WTI',
        currentPrice: '$73.45',
        upOdds: 1.85,
        downOdds: 1.92
      },
      { 
        id: 2, 
        question: 'O Ouro vai descer nos próximos 60 segundos?', 
        asset: 'Ouro',
        currentPrice: '$2,018.30',
        upOdds: 1.78,
        downOdds: 2.05
      },
      { 
        id: 3, 
        question: 'A Prata vai subir nos próximos 60 segundos?', 
        asset: 'Prata',
        currentPrice: '$24.12',
        upOdds: 1.90,
        downOdds: 1.88
      }
    ],
    crypto: [
      { 
        id: 4, 
        question: 'O Bitcoin vai subir nos próximos 60 segundos?', 
        asset: 'Bitcoin',
        currentPrice: '$42,350.00',
        upOdds: 1.82,
        downOdds: 1.95
      },
      { 
        id: 5, 
        question: 'O Ethereum vai descer nos próximos 60 segundos?', 
        asset: 'Ethereum',
        currentPrice: '$2,545.80',
        upOdds: 1.75,
        downOdds: 2.08
      }
    ],
    forex: [
      { 
        id: 6, 
        question: 'O USD/BRL vai subir nos próximos 60 segundos?', 
        asset: 'USD/BRL',
        currentPrice: 'R$ 5.12',
        upOdds: 1.88,
        downOdds: 1.90
      }
    ],
    stocks: [
      { 
        id: 7, 
        question: 'A Apple vai subir nos próximos 60 segundos?', 
        asset: 'AAPL',
        currentPrice: '$185.40',
        upOdds: 1.85,
        downOdds: 1.92
      }
    ]
  };

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCurrentRound(r => r + 1);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    return `${seconds.toString().padStart(2, '0')}s`;
  };

  const currentPools = pools[selectedCategory as keyof typeof pools] || pools.commodities;

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#ff2389]/20 to-[#ff2389]/10 border border-[#ff2389]/30">
              <Zap className="h-8 w-8 text-[#ff2389]" />
            </div>
            <h1 className="text-4xl font-bold text-[#ff2389]">
              Fast Markets
            </h1>
            <div className="animate-pulse">
              <div className="w-3 h-3 rounded-full bg-[#ff2389]"></div>
            </div>
          </div>
          <p className="text-muted-foreground text-lg">
            Mercados de opinião ultrarrápidos - Pools a cada 60 segundos ⚡️
          </p>
          
          {/* Live Round Counter */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <Badge variant="destructive" className="bg-[#ff2389] text-white text-lg px-4 py-2">
              Round #{currentRound}
            </Badge>
            <div className="flex items-center gap-2 text-2xl font-mono font-bold text-[#ff2389]">
              <Clock className="h-6 w-6" />
              {formatTime(countdown)}
            </div>
          </div>
        </div>

        {/* Category Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center">Selecione o Tema</h2>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              {categories.map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="data-[state=active]:bg-[#ff2389] data-[state=active]:text-white"
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Live Pools Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff2389]/10 to-[#ff2389]/5 px-4 py-2 rounded-full border border-[#ff2389]/20">
            <div className="animate-pulse">
              <div className="w-2 h-2 rounded-full bg-[#ff2389]"></div>
            </div>
            <span className="text-sm font-medium text-[#ff2389] uppercase tracking-wide">
              AO VIVO - {currentPools.length} Pools Ativos
            </span>
            <div className="animate-pulse">
              <div className="w-2 h-2 rounded-full bg-[#ff2389]"></div>
            </div>
          </div>
        </div>

        {/* Fast Pools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentPools.map((pool) => (
            <Card 
              key={pool.id} 
              className="border border-[#ff2389]/20 bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm hover:border-[#ff2389]/40 transition-all"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs border-[#ff2389]/50 text-[#ff2389]">
                    <Zap className="h-3 w-3 mr-1" />
                    60s
                  </Badge>
                  <div className="text-xs text-muted-foreground font-mono">
                    #{pool.id}
                  </div>
                </div>
                <CardTitle className="text-sm leading-tight">
                  {pool.question}
                </CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BarChart3 className="h-3 w-3" />
                  <span>{pool.asset}</span>
                  <span className="font-mono">{pool.currentPrice}</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    className="bg-success hover:bg-success/90 text-black font-medium h-12 flex flex-col gap-1"
                    onClick={() => {
                      // Handle bet logic here
                      console.log('Bet UP on', pool.asset);
                    }}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <div className="flex items-center gap-1">
                      <span className="text-xs">⬆️ SIM</span>
                      <span className="text-xs font-bold">{pool.upOdds}x</span>
                    </div>
                  </Button>
                  <Button 
                    className="bg-[#ff2389] hover:bg-[#ff2389]/90 text-white font-medium h-12 flex flex-col gap-1"
                    onClick={() => {
                      // Handle bet logic here
                      console.log('Bet DOWN on', pool.asset);
                    }}
                  >
                    <TrendingDown className="h-4 w-4" />
                    <div className="flex items-center gap-1">
                      <span className="text-xs">⬇️ NÃO</span>
                      <span className="text-xs font-bold">{pool.downOdds}x</span>
                    </div>
                  </Button>
                </div>
                
                {/* Progress bar for time remaining */}
                <div className="mt-3">
                  <div className="w-full bg-muted rounded-full h-1">
                    <div 
                      className="bg-[#ff2389] h-1 rounded-full transition-all duration-1000"
                      style={{ width: `${(countdown / 60) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-[#ff2389]/5 to-transparent border border-[#ff2389]/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-[#ff2389]" />
                <h3 className="text-lg font-semibold text-[#ff2389]">Como Funciona</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Cada pool dura exatamente 60 segundos</p>
                <p>• Aposte se o preço vai subir (⬆️) ou descer (⬇️)</p>
                <p>• Resultados são baseados na variação real dos preços</p>
                <p>• Novos pools começam automaticamente a cada minuto</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Fast;