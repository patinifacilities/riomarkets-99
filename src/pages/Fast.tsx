import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Zap, Clock, BarChart3, Wallet, Plus, ArrowUpDown, ArrowUp, ArrowDown, Bitcoin, DollarSign, Coins, TrendingUpIcon, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from 'next-themes';
import { FastMarketTermsModal } from '@/components/fast/FastMarketTermsModal';
import { FastPoolHistoryModal } from '@/components/fast/FastPoolHistoryModal';
import { FastPoolExpandedModal } from '@/components/fast/FastPoolExpandedModal';
import { DarkModeToggle } from '@/components/layout/DarkModeToggle';
import { Link, useNavigate } from 'react-router-dom';

interface FastPool {
  id: string;
  round_number: number;
  asset_symbol: string;
  asset_name: string;
  question: string;
  category: string;
  opening_price: number;
  closing_price?: number;
  round_start_time: string;
  round_end_time: string;
  base_odds: number;
  status: string;
  result?: string;
  paused?: boolean;
}

interface FastPoolResult {
  id: string;
  result: 'subiu' | 'desceu' | 'manteve';
  opening_price: number;
  closing_price: number;
  price_change_percent: number;
  created_at: string;
  asset_symbol: string;
}

const Fast = () => {
  const [currentPools, setCurrentPools] = useState<FastPool[]>([]);
  const [poolHistory, setPoolHistory] = useState<Record<string, FastPoolResult[]>>({});
  const [countdown, setCountdown] = useState(60);
  const [betAmount, setBetAmount] = useState(100);
  const [clickedPool, setClickedPool] = useState<{id: string, side: string} | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [poolHistoryOpen, setPoolHistoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('crypto');
  const [lastPoolIds, setLastPoolIds] = useState<string[]>([]);
  const [opinionNotifications, setOpinionNotifications] = useState<{id: string, text: string, side?: 'subiu' | 'desceu', timestamp: number}[]>([]);
  const [userPoolBets, setUserPoolBets] = useState<Record<string, number>>({});
  const [expandedPool, setExpandedPool] = useState<FastPool | null>(null);
  const [fastSystemEnabled, setFastSystemEnabled] = useState(true);
  const { user } = useAuth();
  const { data: profile, refetch: refetchProfile } = useProfile(user?.id);
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();

  // Category options for fast pools with styling - Crypto first, then Commodities
  const categoryOptions = [
    { 
      value: 'crypto', 
      label: 'Cripto', 
      bgColor: '#FF6101',
      icon: '₿',
      textColor: '#fff'
    },
    { 
      value: 'commodities', 
      label: window.innerWidth <= 768 ? 'Commod' : 'Commodities', 
      bgColor: '#FFD800',
      icon: '🛢️',
      textColor: '#000'
    },
    { 
      value: 'forex', 
      label: 'Forex', 
      bgColor: '#ff2389',
      icon: '$',
      textColor: '#fff'
    },
    { 
      value: 'stocks', 
      label: 'Ações', 
      bgColor: '#00ff90',
      icon: '📈',
      textColor: '#000'
    }
  ];

  // Check if FAST system is enabled
  useEffect(() => {
    const checkFastStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('fast_pool_configs')
          .select('paused')
          .limit(1)
          .maybeSingle();
        
        if (!error && data) {
          setFastSystemEnabled(!data.paused);
        }
      } catch (error) {
        console.error('Error checking FAST status:', error);
      }
    };

    checkFastStatus();

    // Subscribe to config changes
    const channel = supabase
      .channel('fast-config-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'fast_pool_configs'
        },
        () => {
          checkFastStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Realtime subscription for pool updates
  useEffect(() => {
    const channel = supabase
      .channel('fast-pools-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fast_pools'
        },
        (payload) => {
          console.log('Pool update:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            loadCurrentPools();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fast_pool_results'
        },
        (payload) => {
          console.log('New result:', payload);
          loadPoolHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Check if user has already accepted terms on mount
  useEffect(() => {
    const hasAcceptedTerms = localStorage.getItem('fastMarketsTermsAccepted');
    if (!hasAcceptedTerms) {
      setShowTermsModal(true);
    }
  }, []);

  // Load current pools and history
  const loadCurrentPools = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-fast-pools', {
        body: { 
          action: 'get_current_pool',
          category: selectedCategory 
        }
      });
      
      if (error) throw error;
      
      if (data?.pools && Array.isArray(data.pools)) {
        // Remove duplicates by asset_symbol
        const poolMap = new Map<string, FastPool>();
        (data.pools as FastPool[]).forEach((pool: FastPool) => {
          // If FAST is disabled globally, mark all pools as paused
          const effectivePool = {
            ...pool,
            paused: pool.paused || !fastSystemEnabled
          };
          // Only add the first occurrence of each asset_symbol
          if (!poolMap.has(pool.asset_symbol)) {
            poolMap.set(pool.asset_symbol, effectivePool);
          }
        });
        // Sort by asset_symbol to maintain consistent order
        const uniquePools = Array.from(poolMap.values()).sort((a, b) => 
          a.asset_symbol.localeCompare(b.asset_symbol)
        );
        
        setCurrentPools(uniquePools);
        if (uniquePools.length > 0 && fastSystemEnabled) {
          calculateCountdown(uniquePools[0]); // All pools have same timing
        }
      }
    } catch (error) {
      console.error('Error loading pools:', error);
    }
  }, [selectedCategory, fastSystemEnabled]);

  // Load pool history by category and check for new results - only if FAST is enabled
  const loadPoolHistory = useCallback(async () => {
    // Don't load history if FAST system is disabled
    if (!fastSystemEnabled) {
      setPoolHistory({});
      return;
    }

    try {
      const { data, error } = await supabase
        .from('fast_pool_results')
        .select('*, fast_pools!inner(category)')
        .order('created_at', { ascending: false })
        .limit(100); // Get more to ensure 10 per category
      
      if (error) throw error;
      
      // Group results by category - always keep last 10
      const resultsByCategory: Record<string, FastPoolResult[]> = {};
      
      (data || []).forEach((item: any) => {
        const category = item.fast_pools.category;
        const result = {
          ...item,
          result: item.result as 'subiu' | 'desceu' | 'manteve'
        };
        
        if (!resultsByCategory[category]) {
          resultsByCategory[category] = [];
        }
        
        // Keep only the last 10 results per category
        if (resultsByCategory[category].length < 10) {
          resultsByCategory[category].push(result);
        }
      });
      
      setPoolHistory(resultsByCategory);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }, [fastSystemEnabled]);

  // State for pool results
  const [poolResults, setPoolResults] = useState<Record<string, 'subiu' | 'desceu' | 'manteve' | null>>({});

  // Load user bets for current pools
  const loadUserBets = useCallback(async () => {
    if (!user?.id || !currentPools.length) return;
    
    try {
      const poolIds = currentPools.map(p => p.id);
      const { data, error } = await supabase
        .from('fast_pool_bets')
        .select('pool_id, amount_rioz')
        .eq('user_id', user.id)
        .in('pool_id', poolIds);
        
      if (error) throw error;
      
      const betsByPool: Record<string, number> = {};
      (data || []).forEach(bet => {
        betsByPool[bet.pool_id] = (betsByPool[bet.pool_id] || 0) + bet.amount_rioz;
      });
      
      setUserPoolBets(betsByPool);
    } catch (error) {
      console.error('Error loading user bets:', error);
    }
  }, [user?.id, currentPools]);

  useEffect(() => {
    loadUserBets();
  }, [loadUserBets]);

  // Calculate countdown based on pool end time
  const calculateCountdown = useCallback((pool: FastPool) => {
    const now = new Date().getTime();
    const endTime = new Date(pool.round_end_time).getTime();
    const timeLeft = Math.max(0, (endTime - now) / 1000); // Keep decimals for smooth animation
    setCountdown(timeLeft);
    
    // Check if this is a new set of pools (first second)
    if (timeLeft === 59 && !lastPoolIds.includes(pool.id)) {
      setLastPoolIds([pool.id]);
      
      // Show results for this category if available
      const categoryHistory = poolHistory[selectedCategory];
      if (categoryHistory && categoryHistory.length > 0) {
        const lastResult = categoryHistory[0];
        
        // Store the result
        setPoolResults(prev => ({
          ...prev,
          [selectedCategory]: lastResult.result
        }));
        
        setTimeout(() => {
          toast({
            title: lastResult.result === 'subiu' ? "Subiu! 📈" : lastResult.result === 'desceu' ? "Desceu! 📉" : "Manteve! ➡️",
            description: `${lastResult.asset_symbol}: ${lastResult.price_change_percent > 0 ? '+' : ''}${lastResult.price_change_percent.toFixed(2)}%`,
            duration: 2000,
            className: lastResult.result === 'subiu' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 
                      lastResult.result === 'desceu' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 
                      'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
          });
        }, 500);
        
        // Clear result after 3 seconds
        setTimeout(() => {
          setPoolResults(prev => ({
            ...prev,
            [selectedCategory]: null
          }));
        }, 3000);
      }
    }
  }, [lastPoolIds, poolHistory, selectedCategory, toast]);

  // Initialize and reload when category changes
  useEffect(() => {
    loadCurrentPools();
    loadPoolHistory();
  }, [loadCurrentPools, loadPoolHistory, selectedCategory]);

  // Countdown timer with smooth updates
  useEffect(() => {
    if (!currentPools.length || countdown <= 0) return;
    
    const timer = setInterval(() => {
      calculateCountdown(currentPools[0]); // All pools have same timing
    }, 16); // Update every 16ms for 60fps smooth animation

    return () => clearInterval(timer);
  }, [currentPools, countdown, calculateCountdown]);

  // Pool finalization and new pool creation
  useEffect(() => {
    if (countdown <= 0 && currentPools.length > 0) {
      finalizePools();
    }
  }, [countdown, currentPools]);

  const finalizePools = async () => {
    if (!currentPools.length) return;
    
    try {
      // Finalize all pools in parallel
      await Promise.all(
        currentPools.map(pool => 
          supabase.functions.invoke('manage-fast-pools', {
            body: { 
              action: 'finalize_pool',
              poolId: pool.id 
            }
          })
        )
      );
      
      // Reset user bets for current pools
      setUserPoolBets({});
      
      // Wait a bit for pools to be processed and created
      setTimeout(() => {
        loadCurrentPools();
        loadPoolHistory();
      }, 2000);
      
    } catch (error) {
      console.error('Error finalizing pools:', error);
      // Still try to load new pools even if finalization fails
      setTimeout(() => {
        loadCurrentPools();
        loadPoolHistory();
      }, 2000);
    }
  };

  // Load algorithm config for dynamic odds calculation
  const [algorithmConfig, setAlgorithmConfig] = React.useState({
    pool_duration_seconds: 60,
    lockout_time_seconds: 15,
    odds_start: 1.80,
    odds_end: 1.10
  });

  React.useEffect(() => {
    const loadAlgorithmConfig = async () => {
      try {
        const { data } = await supabase
          .from('fast_pool_algorithm_config')
          .select('pool_duration_seconds, lockout_time_seconds, odds_start, odds_end')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (data) {
          setAlgorithmConfig({
            pool_duration_seconds: data.pool_duration_seconds,
            lockout_time_seconds: data.lockout_time_seconds,
            odds_start: Number(data.odds_start),
            odds_end: Number(data.odds_end)
          });
        }
      } catch (error) {
        console.error('Error loading algorithm config:', error);
      }
    };
    
    loadAlgorithmConfig();
  }, []);

  // Calculate dynamic odds based on countdown and algorithm config
  const getOdds = () => {
    const duration = algorithmConfig.pool_duration_seconds;
    const lockout = algorithmConfig.lockout_time_seconds;
    const oddsStart = algorithmConfig.odds_start;
    const oddsEnd = algorithmConfig.odds_end;
    
    const timeElapsed = duration - countdown;
    const effectiveTime = duration - lockout; // Time before lockout
    
    if (timeElapsed >= effectiveTime) {
      // During lockout period
      return oddsEnd;
    }
    
    // Calculate progress through the effective time
    const progress = timeElapsed / effectiveTime;
    const oddsDiff = oddsStart - oddsEnd;
    
    // Linear decrease from start to end odds
    return Math.max(oddsEnd, oddsStart - (progress * oddsDiff));
  };

  // Play coin sound effect for profit
  const playCoinSound = () => {
    const audio = new Audio('/sounds/coin.mp3');
    audio.volume = 0.3;
    audio.play().catch(console.error);
  };

  // Check for user winnings for the recently completed pool
  const checkForWinnings = useCallback(async (poolId: string, betSide: 'subiu' | 'desceu') => {
    if (!user) return;
    
    try {
      // Wait for pool to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data: bet } = await supabase
        .from('fast_pool_bets')
        .select('*, fast_pool_results(*)')
        .eq('user_id', user.id)
        .eq('pool_id', poolId)
        .single();
        
      if (bet && bet.processed && bet.payout_amount > 0) {
        playCoinSound();
        const winAmount = bet.payout_amount - bet.amount_rioz;
        
        // Immediately refresh profile to update balance
        refetchProfile();
        
        // Show bottom-right notification
        toast({
          title: "🎉 Você ganhou!",
          description: `Parabéns! Você ganhou ${winAmount.toFixed(0)} RZ`,
          duration: 6000,
          className: 'bg-[#00ff90]/10 border-[#00ff90] fixed bottom-4 right-4'
        });
        
        // Trigger header animation and force refresh
        const event = new CustomEvent('fastWinAnimation', { 
          detail: { amount: winAmount } 
        });
        window.dispatchEvent(event);
        
        // Force header to refresh balance
        window.dispatchEvent(new CustomEvent('forceProfileRefresh'));
      }
    } catch (error) {
      console.error('Error checking winnings:', error);
    }
  }, [user, toast, refetchProfile]);

  const handleBet = async (poolId: string, side: 'subiu' | 'desceu') => {
    console.log('🎯 handleBet called', { poolId, side, countdown, betAmount, userBalance: profile?.saldo_moeda });
    
    if (!user || !currentPools.length) {
      console.log('❌ Blocked: no user or no pools');
      window.location.href = '/auth';
      return;
    }

    // Check if user is blocked
    if (profile?.is_blocked) {
      toast({
        title: "Conta bloqueada",
        description: "Sua conta está temporariamente bloqueada. Entre em contato com o suporte.",
        variant: "destructive"
      });
      return;
    }

    const pool = currentPools.find(p => p.id === poolId);
    if (!pool) return;

    // Check if pool is paused
    if (pool.paused) {
      toast({
        title: "Pool pausado",
        description: "Este pool está temporariamente pausado. Aguarde o retorno.",
        variant: "destructive"
      });
      return;
    }

    if (countdown <= algorithmConfig.lockout_time_seconds) {
      toast({
        title: "Tempo esgotado",
        description: `Não é possível opinar nos últimos ${algorithmConfig.lockout_time_seconds} segundos.`,
        variant: "destructive"
      });
      return;
    }

    if (!profile?.saldo_moeda || profile.saldo_moeda < betAmount) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não tem saldo suficiente para esta opinião.",
        variant: "destructive"
      });
      return;
    }

    try {
      const currentOdds = getOdds();
      const potentialWinnings = Math.floor(betAmount * currentOdds);
      
      // Deduct bet amount from user balance
      const { error: deductError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: -betAmount
      });

      if (deductError) throw deductError;

      // Place bet with all details
      const { error: betError } = await supabase
        .from('fast_pool_bets')
        .insert({
          user_id: user.id,
          pool_id: poolId,
          side: side,
          amount_rioz: betAmount,
          odds: currentOdds
        });

      if (betError) throw betError;

      console.log('✅ Bet placed successfully!');
      
      // Close the modal
      setExpandedPool(null);

      // Add click animation
      setClickedPool({ id: poolId, side });
      setTimeout(() => setClickedPool(null), 400);

      // Add new opinion notification with button color
      const newNotification = {
        id: Date.now().toString(),
        text: 'Opinião registrada',
        side: side,
        timestamp: Date.now()
      };
      setOpinionNotifications(prev => [...prev, newNotification]);
      
      // Remove notification after exactly 3 seconds with fadeout
      setTimeout(() => {
        setOpinionNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 3000);

      // Register transaction in wallet_transactions as pending bet (not shown in Fast Markets card)
      await supabase
        .from('wallet_transactions')
        .insert({
          id: `fast_bet_pending_${Date.now()}_${user.id}`,
          user_id: user.id,
          tipo: 'debito',
          valor: betAmount,
          descricao: `Fast Market - Aposta Pendente - ${side === 'subiu' ? 'Subiu' : 'Desceu'} - ${pool.asset_name}`,
          market_id: poolId
        });

      // Refresh profile and check for winnings after pool finishes
      refetchProfile();
      
      // Update user pool bets
      setUserPoolBets(prev => ({
        ...prev,
        [poolId]: (prev[poolId] || 0) + betAmount
      }));
      
      // Check for winnings after pool finishes (65 seconds + processing time)
      setTimeout(() => {
        checkForWinnings(poolId, side);
      }, 65000);

    } catch (error) {
      console.error('Bet error:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar opinião. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const openHistoryModal = () => {
    setSelectedPool(selectedCategory);
    setPoolHistoryOpen(true);
  };

  if (!currentPools.length) {
    return (
      <>
        {/* Hide footer on loading screen only */}
        <style>{`
          footer { display: none !important; }
        `}</style>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
          <div className="text-center mx-auto">
              <div className="w-32 h-32 rounded-full bg-[#ff2389]/5 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-16 h-16 text-[#ff2389]" style={{
                  animation: 'blink-118bpm 0.508s infinite'
                }} />
              </div>
            <p className="text-muted-foreground text-center">Carregando Fast Markets...</p>
            <style>{`
              @keyframes blink-118bpm {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
              }
            `}</style>
          </div>
        </div>
      </>
    );
  }

  // Get pool icon based on asset symbol
  const getPoolIcon = (assetSymbol: string) => {
    const iconMap: Record<string, any> = {
      'BTC': Bitcoin,
      'ETH': Coins,
      'SOL': Coins,
      'OIL': () => <span className="text-lg">🛢️</span>,
      'GOLD': () => <span className="text-lg">🏆</span>,
      'SILVER': () => <span className="text-lg">🥈</span>,
      'BRL/USD': DollarSign,
      'EUR/USD': DollarSign,
      'JPY/USD': DollarSign,
      'TSLA': TrendingUpIcon,
      'AAPL': TrendingUpIcon,
      'AMZN': TrendingUpIcon
    };
    
    const IconComponent = iconMap[assetSymbol];
    return IconComponent ? (typeof IconComponent === 'function' && IconComponent.name === '' ? <IconComponent /> : <IconComponent className="w-5 h-5" />) : <BarChart3 className="w-5 h-5" />;
  };

  const currentCategoryHistory = poolHistory[selectedCategory] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hide elements on mobile and add animations */}
      <style>{`
        @media (max-width: 768px) {
          .riana-chat-button,
          .dark-mode-toggle-duplicate,
          .header-dark-toggle,
          [data-testid="dark-mode-toggle"],
          .fixed-dark-mode-toggle {
            display: none !important;
          }
        }
        
        @keyframes heartbeat {
          0% { transform: scale(1); }
          14% { transform: scale(1.05); }
          28% { transform: scale(1); }
          42% { transform: scale(1.05); }
          70% { transform: scale(1); }
        }
        
        @keyframes outline-animation-commodities {
          0% { border-color: transparent; }
          50% { border-color: #FFD800; box-shadow: 0 0 10px #FFD800; }
          100% { border-color: transparent; }
        }
        
        @keyframes outline-animation-crypto {
          0% { border-color: transparent; }
          50% { border-color: #FF6101; box-shadow: 0 0 10px #FF6101; }
          100% { border-color: transparent; }
        }
        
        @keyframes outline-animation-forex {
          0% { border-color: transparent; }
          50% { border-color: #ff2389; box-shadow: 0 0 10px #ff2389; }
          100% { border-color: transparent; }
        }
        
        @keyframes outline-animation-stocks {
          0% { border-color: transparent; }
          50% { border-color: #00ff90; box-shadow: 0 0 10px #00ff90; }
          100% { border-color: transparent; }
        }
        
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.08); }
          50% { transform: scale(1); }
          75% { transform: scale(1.08); }
        }
        
        @keyframes rearrange-in {
          0% { 
            transform: translateY(-20px) scale(0.95); 
            opacity: 0; 
          }
          100% { 
            transform: translateY(0) scale(1); 
            opacity: 1; 
          }
        }
        
        @keyframes fadeout {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        @keyframes outline-animation-crypto {
          0% { border-color: transparent; }
          50% { border-color: #FF6101; box-shadow: 0 0 10px #FF6101; }
          100% { border-color: transparent; }
        }
        
        @keyframes outline-animation-forex {
          0% { border-color: transparent; }
          50% { border-color: #ff2389; box-shadow: 0 0 10px #ff2389; }
          100% { border-color: transparent; }
        }
        
        @keyframes outline-animation-stocks {
          0% { border-color: transparent; }
          50% { border-color: #00ff90; box-shadow: 0 0 10px #00ff90; }
          100% { border-color: transparent; }
        }
      `}</style>
      
      <div className="container mx-auto px-4 pt-8 pb-20">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff2389]/10 to-[#ff2389]/5 px-6 py-3 rounded-full border border-[#ff2389]/20 mb-4">
            <Zap className="w-5 h-5 text-[#ff2389] animate-pulse" />
            <span className="text-[#ff2389] font-semibold tracking-wide">FAST MARKETS</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Pools de opinião de <span className="text-primary">60 segundos</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            Opine se o ativo vai subir ou descer nos próximos 60 segundos. Odds dinâmicas baseadas em dados reais de mercado.
          </p>
          
          {/* Category Selector */}
          <div className="flex justify-center items-center mb-6">
            <div className="flex gap-2 p-1 bg-muted rounded-xl">
              {categoryOptions.map((category) => (
                <Button
                  key={category.value}
                  variant="ghost"
                  size="lg"
                  onClick={() => setSelectedCategory(category.value)}
                  className={cn(
                    "transition-all duration-75 font-bold rounded-xl px-10 py-6 text-base",
                    selectedCategory === category.value 
                      ? "shadow-lg border-2 scale-105" 
                      : "hover:bg-muted-foreground/10"
                  )}
                  style={selectedCategory === category.value ? {
                    backgroundColor: category.bgColor,
                    color: category.textColor,
                    borderColor: category.bgColor
                  } : {}}
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Current Pools Grid */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="grid md:grid-cols-3 gap-6">
            {currentPools.map((pool, index) => (
              <Card 
                key={pool.id} 
                className={cn(
                  "relative overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-card/50 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-lg",
                  (pool as any).paused && "opacity-50 grayscale"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-[#ff2389]/5"></div>
                
                {(pool as any).paused && (
                  <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
                    <div className="text-center px-4">
                      <div className="text-5xl mb-3">🚧</div>
                      <p className="text-white font-bold text-lg mb-1">Em Atualização</p>
                      <p className="text-white/70 text-sm">Pools temporariamente indisponíveis</p>
                    </div>
                  </div>
                )}
                
                <CardHeader 
                  className="relative z-10 text-center pb-3 cursor-pointer"
                  onClick={() => {
                    if (!user) {
                      navigate('/auth');
                    } else {
                      navigate(`/asset/${pool.asset_symbol}`);
                    }
                  }}
                >
                   <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2">
                       {getPoolIcon(pool.asset_symbol)}
                       <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                         Pool #{pool.round_number}
                       </Badge>
                     </div>
                     <div className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-lg">
                       Seu total: <span className="text-[#00ff90] font-semibold">{userPoolBets[pool.id] || 0} RZ</span>
                     </div>
                   </div>
                  
                  <CardTitle className="text-lg mb-2">
                    {pool.asset_name}
                  </CardTitle>
                  
                  <p className="text-sm text-muted-foreground mb-2">{pool.question}</p>
                  
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <span className="bg-muted/50 px-2 py-1 rounded">{pool.asset_symbol}</span>
                    <span>•</span>
                    <span>${pool.opening_price.toLocaleString()}</span>
                  </div>
                </CardHeader>

                <CardContent className="relative z-10 space-y-4">

                   {/* Bet Amount Slider and Countdown - shared across all pools */}
                   <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                      <label className="text-xs font-semibold flex items-center justify-between">
                        <span>Opinar</span>
                        <span className="text-base text-primary font-bold">{betAmount} RZ</span>
                      </label>
                      <div className="relative px-4 py-4 bg-gradient-to-br from-muted/40 via-muted/30 to-muted/20 rounded-2xl border-2 border-border/60 shadow-inner">
                        <input
                           type="range"
                           min="1"
                           max="1000"
                           step="1"
                           value={betAmount}
                           onChange={(e) => setBetAmount(Number(e.target.value))}
                           className="w-full h-3 rounded-full appearance-none cursor-pointer slider relative z-10"
                           style={{
                             background: `linear-gradient(to right, #00ff90 0%, #00ff90 ${((betAmount - 1) / 999) * 100}%, rgba(255,255,255,0.1) ${((betAmount - 1) / 999) * 100}%, rgba(255,255,255,0.1) 100%)`
                           }}
                         />
                         <style>{`
                           input[type="range"].slider::-webkit-slider-thumb {
                             appearance: none;
                             width: 28px;
                             height: 28px;
                             border-radius: 50%;
                             background: linear-gradient(135deg, #00ff90 0%, #00dd80 50%, #00cc70 100%);
                             cursor: grab;
                             border: 4px solid white;
                             box-shadow: 0 3px 12px rgba(0, 255, 144, 0.5), 0 0 0 2px rgba(0, 255, 144, 0.2), inset 0 1px 3px rgba(255,255,255,0.3);
                             transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                           }
                           input[type="range"].slider::-webkit-slider-thumb:hover {
                             transform: scale(1.15);
                             box-shadow: 0 5px 16px rgba(0, 255, 144, 0.7), 0 0 0 3px rgba(0, 255, 144, 0.3), inset 0 1px 3px rgba(255,255,255,0.4);
                           }
                           input[type="range"].slider::-webkit-slider-thumb:active {
                             cursor: grabbing;
                             transform: scale(1.05);
                             box-shadow: 0 2px 8px rgba(0, 255, 144, 0.6), 0 0 0 2px rgba(0, 255, 144, 0.25);
                           }
                           input[type="range"].slider::-moz-range-thumb {
                             width: 28px;
                             height: 28px;
                             border-radius: 50%;
                             background: linear-gradient(135deg, #00ff90 0%, #00dd80 50%, #00cc70 100%);
                             cursor: grab;
                             border: 4px solid white;
                             box-shadow: 0 3px 12px rgba(0, 255, 144, 0.5), 0 0 0 2px rgba(0, 255, 144, 0.2);
                             transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                           }
                           input[type="range"].slider::-moz-range-thumb:hover {
                             transform: scale(1.15);
                             box-shadow: 0 5px 16px rgba(0, 255, 144, 0.7), 0 0 0 3px rgba(0, 255, 144, 0.3);
                           }
                           input[type="range"].slider::-moz-range-thumb:active {
                             cursor: grabbing;
                             transform: scale(1.05);
                           }
                         `}</style>
                        <div className="flex justify-between text-[10px] font-semibold text-muted-foreground/70 mt-2.5 px-1">
                          <span>1 RZ</span>
                          <span>1.000 RZ</span>
                        </div>
                      </div>
                    </div>

                   {/* Countdown Timer */}
                    <div className="text-center">
                      <div className={`text-2xl font-bold mb-2 ${
                        countdown <= 0 
                          ? poolResults[selectedCategory] === 'subiu' 
                            ? 'text-[#00ff90]' 
                            : poolResults[selectedCategory] === 'desceu' 
                            ? 'text-[#ff2389]' 
                            : poolResults[selectedCategory] === 'manteve'
                            ? 'text-muted-foreground'
                            : 'text-muted-foreground animate-pulse'
                          : 'text-[#ff2389]'
                      }`}
                      style={countdown <= 23 && countdown > 0 ? {
                        animation: `pulse ${Math.max(0.2, (countdown - 23) / 37 * 2)}s cubic-bezier(0.4, 0, 0.6, 1) infinite`
                      } : undefined}
                      >
                         {countdown > 0 
                           ? `${countdown.toFixed(2)}s` 
                           : poolResults[selectedCategory] === 'subiu'
                           ? 'Subiu! 📈'
                           : poolResults[selectedCategory] === 'desceu'
                           ? 'Desceu! 📉'
                           : poolResults[selectedCategory] === 'manteve'
                           ? 'Manteve! ➡️'
                           : 'Aguarde...'
                         }
                       </div>
                      <div className="w-full bg-muted/20 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#ff2389] to-[#ff2389]/80"
                           style={{ 
                             width: `${(countdown / 60) * 100}%`,
                             transition: 'width 16ms linear',
                             animation: countdown <= 23 && countdown > 0 ? `pulse ${Math.max(0.2, (countdown - 23) / 37 * 2)}s cubic-bezier(0.4, 0, 0.6, 1) infinite` : undefined
                           }}
                        />
                      </div>
                   </div>

                   {/* Opinion Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBet(pool.id, 'subiu');
                      }}
                      disabled={countdown <= 15}
                      className={`h-12 text-sm font-semibold transition-all duration-300 ${
                        clickedPool?.id === pool.id && clickedPool?.side === 'subiu'
                          ? 'scale-[1.02] shadow-lg shadow-[#00ff90]/30 ring-2 ring-[#00ff90]/50 animate-pulse'
                          : ''
                      } bg-[#00ff90] hover:bg-[#00ff90]/90 text-black`}
                    >
                      <div className="flex items-center justify-between w-full px-1">
                        <ArrowUp className="w-4 h-4" />
                        <span>Subir</span>
                           <span className="text-xs opacity-80">
                            x{getOdds().toFixed(2)}
                          </span>
                      </div>
                    </Button>
                    
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBet(pool.id, 'desceu');
                      }}
                      disabled={countdown <= 15}
                      className={`h-12 text-sm font-semibold transition-all duration-300 ${
                        clickedPool?.id === pool.id && clickedPool?.side === 'desceu'
                          ? 'scale-[1.02] shadow-lg shadow-[#ff2389]/30 ring-2 ring-[#ff2389]/50 animate-pulse'
                          : ''
                      } bg-[#ff2389] hover:bg-[#ff2389]/90 text-white`}
                    >
                      <div className="flex items-center justify-between w-full px-1">
                        <ArrowDown className="w-4 h-4" />
                        <span>Descer</span>
                         <span className="text-xs opacity-80">
                           x{getOdds().toFixed(2)}
                         </span>
                      </div>
                    </Button>
                  </div>

                   {countdown <= 15 && (
                     <div className="text-center text-xs text-muted-foreground">
                       Opiniões bloqueadas
                     </div>
                   )}
                  
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Results - Category Specific */}
        {currentCategoryHistory.length > 0 && (
          <div className="max-w-4xl mx-auto mb-6">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <ArrowUpDown className="w-5 h-5" />
                   Últimos Resultados - {categoryOptions.find(c => c.value === selectedCategory)?.label}
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {currentCategoryHistory.slice(0, 10).map((result, index) => {
                      const isRecent = index < 3;
                      const highlightColor = result.result === 'subiu' 
                        ? 'bg-[#00ff90]/10 border-[#00ff90]/30 ring-1 ring-[#00ff90]/20' 
                        : result.result === 'desceu'
                        ? 'bg-[#ff2389]/10 border-[#ff2389]/30 ring-1 ring-[#ff2389]/20'
                        : 'bg-muted/30 border-muted-foreground/30 ring-1 ring-muted-foreground/20';
                      
                      return (
                        <div
                          key={result.id}
                          className={`flex flex-col items-center p-3 rounded-lg border transition-all duration-300 relative animate-fade-in ${
                            isRecent 
                              ? highlightColor + ' shadow-sm'
                              : 'bg-muted/20 border-border'
                          }`}
                          style={{
                            animationDelay: `${index * 50}ms`
                          }}
                        >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                          result.result === 'subiu' 
                            ? 'bg-green-100 dark:bg-green-900/30' 
                            : result.result === 'desceu'
                            ? 'bg-red-100 dark:bg-red-900/30'
                            : 'bg-gray-100 dark:bg-gray-900/30'
                        }`}>
                          {result.result === 'subiu' ? (
                            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : result.result === 'desceu' ? (
                            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                          ) : (
                            <span className="text-xs font-bold text-gray-600 dark:text-gray-400">=</span>
                          )}
                        </div>
                        <span className="text-xs font-medium">{result.asset_symbol}</span>
                        <span className="text-xs text-muted-foreground">
                          {result.price_change_percent > 0 ? '+' : ''}{result.price_change_percent.toFixed(2)}%
                        </span>
                      </div>
                    )})}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TradingView Info - No background */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex items-center justify-center gap-3 p-4 rounded-xl border border-border/50">
            <p className="text-sm text-muted-foreground">
              Cotações em <span className="font-semibold text-foreground">tempo real</span> diretamente do <span className="font-semibold text-foreground">TradingView</span>
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="max-w-4xl mx-auto mt-12 grid md:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-primary/5 via-transparent to-transparent border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Zap className="w-5 h-5" />
                Como Funciona
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <p>• Cada pool dura exatamente 60 segundos</p>
                <p>• 3 pools simultâneos por categoria</p>
                <p>• Opine se o ativo vai subir (SIM) ou descer (NÃO)</p>
                <p>• Resultado baseado em dados reais de mercado</p>
                <p>• Odds dinâmicas que diminuem com o tempo</p>
                <p>• Apostas bloqueadas nos últimos 10 segundos</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#ff2389]/5 via-transparent to-transparent border-[#ff2389]/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#ff2389]">
                <BarChart3 className="w-5 h-5" />
                Categorias Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <p>• <strong>Commodities:</strong> Petróleo, Ouro, Prata</p>
                <p>• <strong>Cripto:</strong> Bitcoin, Ethereum, Solana</p>
                <p>• <strong>Forex:</strong> BRL/USD, EUR/USD, JPY/USD</p>
                <p>• <strong>Ações:</strong> Tesla, Apple, Amazon</p>
                <p>• Todos sincronizados em tempo real</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        
        {/* Terms Button at Bottom */}
        <div className="max-w-4xl mx-auto mt-8 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTermsModal(true)}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <AlertTriangle className="w-4 h-4" />
            Termos Fast Markets
          </Button>
        </div>
      </div>

      {/* Opinion Notifications Stack - Bottom right, above Riana */}
      <div className="fixed bottom-24 right-4 z-30 space-y-2 max-w-xs">
        {opinionNotifications.map((notification, index) => (
          <div 
            key={notification.id}
            className={`px-6 py-3 rounded-xl shadow-lg border animate-scale-in transition-opacity duration-300 ${
              notification.side === 'subiu' 
                ? 'bg-[#00ff90] text-black border-[#00ff90]' 
                : 'bg-[#ff2389] text-white border-[#ff2389]'
            }`}
            style={{ 
              zIndex: 30 - index 
            }}
          >
            <p className="font-medium">{notification.text}</p>
          </div>
        ))}
      </div>

      {/* Modals */}
      <FastMarketTermsModal 
        open={showTermsModal} 
        onOpenChange={setShowTermsModal}
        onAccept={() => {
          localStorage.setItem('fastMarketsTermsAccepted', 'true');
          setShowTermsModal(false);
        }}
      />
      
      <FastPoolHistoryModal
        open={poolHistoryOpen}
        onOpenChange={setPoolHistoryOpen}
        assetSymbol={selectedPool || selectedCategory}
        timeLeft={countdown}
      />
      
      <FastPoolExpandedModal
        pool={expandedPool}
        open={!!expandedPool}
        onOpenChange={(open) => !open && setExpandedPool(null)}
        countdown={countdown}
        betAmount={betAmount}
        setBetAmount={setBetAmount}
        onBet={handleBet}
        clickedPool={clickedPool}
        getOdds={getOdds}
        userPoolBet={expandedPool ? userPoolBets[expandedPool.id] : 0}
        poolResult={expandedPool ? poolResults[selectedCategory] : null}
        opinionNotifications={opinionNotifications}
        poolSpecificHistory={expandedPool ? currentCategoryHistory.filter(r => r.asset_symbol === expandedPool.asset_symbol) : []}
      />
    </div>
  );
};

export default Fast;