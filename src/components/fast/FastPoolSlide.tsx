import { useNavigate } from 'react-router-dom';
import { Zap, TrendingUp, TrendingDown, Users, Clock, Target } from 'lucide-react';
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

  const handleSlideClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onClick) onClick();
    if (pool?.id) {
      navigate(`/fast/${pool.id}`);
    } else {
      navigate('/fast');
    }
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
      className="relative h-full w-full overflow-hidden rounded-2xl cursor-pointer group"
    >
      {/* Clean gradient background with shadow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff2389] via-[#ff0066] to-[#cc0052]">
        {/* Animated Fast Icon Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <Zap className="w-96 h-96 text-white animate-pulse" style={{ animationDuration: '2s' }} />
        </div>
        {/* Subtle overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center px-4 md:px-12 py-6 md:py-0">
        <div className="flex flex-col md:flex-row items-center justify-between w-full gap-6 md:gap-8">
          {/* Left side - Pool info */}
          <div className="flex-1 w-full md:max-w-2xl space-y-4 md:space-y-6 text-center md:text-left">
            {/* Fast Badge with improved animation */}
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mx-auto md:mx-0 animate-[pulse_1.5s_ease-in-out_infinite]">
              <Zap className="w-4 md:w-5 h-4 md:h-5 text-white fill-white animate-bounce" style={{ animationDuration: '1s' }} />
              <span className="text-white font-bold text-sm md:text-lg">FAST POOL</span>
            </div>
            
            {/* Pool Icon & Name */}
            <div className="flex items-center gap-3 md:gap-4 justify-center md:justify-start">
              <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center">
                <span className="text-2xl md:text-4xl">₿</span>
              </div>
              <div>
                <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                  {pool.asset_name}
                </h2>
                <p className="text-white/80 text-sm md:text-xl mt-1">{pool.question}</p>
              </div>
            </div>
            
            {/* Stats Row */}
            <div className="flex items-center justify-center md:justify-start gap-2 md:gap-4 flex-wrap">
              {/* Timer */}
              <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-3 rounded-xl bg-white/20 border border-white/30 backdrop-blur-sm">
                <Clock className="w-4 md:w-5 h-4 md:h-5 text-white" />
                <span className="text-white font-bold text-sm md:text-xl">{formatTime(timeLeft)}</span>
              </div>
              
              {/* Current Price */}
              {pool.opening_price && (
                <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-3 rounded-xl bg-white/20 border border-white/30 backdrop-blur-sm">
                  <TrendingUp className="w-4 md:w-5 h-4 md:h-5 text-white" />
                  <span className="text-white font-bold text-sm md:text-xl">
                    ${pool.opening_price.toLocaleString()}
                  </span>
                </div>
              )}
              
              {/* Participants */}
              <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-3 rounded-xl bg-white/20 border border-white/30 backdrop-blur-sm">
                <Users className="w-4 md:w-5 h-4 md:h-5 text-white" />
                <span className="text-white font-bold text-sm md:text-xl">Live</span>
              </div>
            </div>

            {/* Options */}
            <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-3 md:gap-4 w-full">
              <div className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 rounded-xl bg-white/30 border-2 border-white/50 backdrop-blur-sm hover:scale-105 transition-transform w-full md:w-auto justify-center">
                <TrendingUp className="w-5 md:w-6 h-5 md:h-6 text-white" />
                <span className="text-white font-bold text-base md:text-xl">SUBIU</span>
                <span className="text-white/80 text-sm md:text-lg">{pool.base_odds.toFixed(2)}x</span>
              </div>
              
              <div className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 rounded-xl bg-white/30 border-2 border-white/50 backdrop-blur-sm hover:scale-105 transition-transform w-full md:w-auto justify-center">
                <TrendingDown className="w-5 md:w-6 h-5 md:h-6 text-white" />
                <span className="text-white font-bold text-base md:text-xl">DESCEU</span>
                <span className="text-white/80 text-sm md:text-lg">{pool.base_odds.toFixed(2)}x</span>
              </div>
            </div>
          </div>
          
          {/* Right side - Analisar button */}
          <div className="flex items-center justify-center w-full md:w-auto">
            <Button
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                handleSlideClick(e);
              }}
              className="font-bold px-8 md:px-10 py-6 md:py-8 rounded-full text-lg md:text-xl transition-all hover:scale-110 shadow-2xl group-hover:shadow-[#00ff90]/50 w-full md:w-auto"
              style={{ backgroundColor: '#00ff90', color: '#000000' }}
            >
              <Target className="w-5 md:w-6 h-5 md:h-6 mr-2" />
              ANALISAR
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
