import { useNavigate } from 'react-router-dom';
import { Zap, TrendingUp, TrendingDown, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FastPool {
  id: string;
  asset_symbol: string;
  asset_name: string;
  question: string;
  round_start_time: string;
  round_end_time: string;
  opening_price: number | null;
  base_odds: number;
  category: string;
}

interface FastPoolSlideProps {
  onClick?: () => void;
}

export const FastPoolSlide = ({ onClick }: FastPoolSlideProps) => {
  const navigate = useNavigate();
  const [pool, setPool] = useState<FastPool | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const fetchBitcoinPool = async () => {
      const { data, error } = await supabase
        .from('fast_pools')
        .select('*')
        .eq('asset_symbol', 'BTC')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        setPool(data);
      }
    };

    fetchBitcoinPool();
    const interval = setInterval(fetchBitcoinPool, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!pool) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(pool.round_end_time).getTime();
      const diff = Math.max(0, end - now);
      setTimeLeft(Math.floor(diff / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [pool]);

  const handleSlideClick = () => {
    if (onClick) onClick();
    navigate(`/ativo/BTC`);
  };

  if (!pool) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      onClick={handleSlideClick}
      className="relative h-[500px] w-full overflow-hidden rounded-2xl cursor-pointer group"
    >
      {/* Animated Fast Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff2389] via-[#ff0066] to-[#cc0052]">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,_transparent_0%,_#000_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_transparent_0%,_#000_100%)]" />
        </div>
        
        {/* Animated dots pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-pulse" />
          <div className="absolute top-32 right-20 w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-20 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-40 right-1/3 w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center px-12">
        <div className="flex items-center justify-between w-full gap-8">
          {/* Left side - Pool info */}
          <div className="flex-1 max-w-2xl space-y-6">
            {/* Fast Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
              <Zap className="w-5 h-5 text-white fill-white animate-pulse" />
              <span className="text-white font-bold text-lg">FAST POOL</span>
            </div>
            
            {/* Pool Icon & Name */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center">
                <span className="text-4xl">₿</span>
              </div>
              <div>
                <h2 className="text-5xl font-bold text-white leading-tight">
                  {pool.asset_name}
                </h2>
                <p className="text-white/80 text-xl mt-1">{pool.question}</p>
              </div>
            </div>
            
            {/* Stats Row */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Timer */}
              <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/20 border border-white/30 backdrop-blur-sm">
                <Clock className="w-5 h-5 text-white" />
                <span className="text-white font-bold text-xl">{formatTime(timeLeft)}</span>
              </div>
              
              {/* Current Price */}
              {pool.opening_price && (
                <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/20 border border-white/30 backdrop-blur-sm">
                  <TrendingUp className="w-5 h-5 text-white" />
                  <span className="text-white font-bold text-xl">
                    ${pool.opening_price.toLocaleString()}
                  </span>
                </div>
              )}
              
              {/* Participants */}
              <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/20 border border-white/30 backdrop-blur-sm">
                <Users className="w-5 h-5 text-white" />
                <span className="text-white font-bold text-xl">Live</span>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-white/30 border-2 border-white/50 backdrop-blur-sm hover:scale-105 transition-transform">
                <TrendingUp className="w-6 h-6 text-white" />
                <span className="text-white font-bold text-xl">SUBIU</span>
                <span className="text-white/80 text-lg">{pool.base_odds.toFixed(2)}x</span>
              </div>
              
              <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-white/30 border-2 border-white/50 backdrop-blur-sm hover:scale-105 transition-transform">
                <TrendingDown className="w-6 h-6 text-white" />
                <span className="text-white font-bold text-xl">DESCEU</span>
                <span className="text-white/80 text-lg">{pool.base_odds.toFixed(2)}x</span>
              </div>
            </div>
          </div>
          
          {/* Right side - Play button */}
          <div className="flex items-center justify-center">
            <Button
              size="lg"
              className="bg-white text-[#ff2389] hover:bg-white/90 font-bold px-10 py-8 rounded-full text-xl transition-all hover:scale-110 shadow-2xl group-hover:shadow-white/50"
            >
              <Zap className="w-6 h-6 mr-2 fill-current" />
              JOGAR AGORA
            </Button>
          </div>
        </div>
      </div>

      {/* Pulse animation overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-white/5 animate-pulse" style={{ animationDuration: '3s' }} />
      </div>
    </div>
  );
};
