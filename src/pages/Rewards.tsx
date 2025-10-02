import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLoginStreak } from '@/hooks/useLoginStreak';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Flame, Trophy, Star, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function Rewards() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { 
    streakInfo, 
    isLoading, 
    claimReward, 
    isClaiming,
    canClaim7Day,
    canClaim30Day,
    hasClaimed7Day,
    hasClaimed30Day
  } = useLoginStreak();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleClaim7Day = () => {
    claimReward({ rewardType: '7_day', rewardAmount: 50 }, {
      onSuccess: () => {
        toast.success('🎉 Recompensa resgatada!', {
          description: 'Você ganhou 50 RIOZ!'
        });
      },
      onError: () => {
        toast.error('Erro ao resgatar recompensa');
      }
    });
  };

  const handleClaim30Day = () => {
    claimReward({ rewardType: '30_day', rewardAmount: 200 }, {
      onSuccess: () => {
        toast.success('🎉 Recompensa resgatada!', {
          description: 'Você ganhou 200 RIOZ!'
        });
      },
      onError: () => {
        toast.error('Erro ao resgatar recompensa');
      }
    });
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentStreak = streakInfo?.current_streak || 0;
  const longestStreak = streakInfo?.longest_streak || 0;
  const totalLogins = streakInfo?.total_logins || 0;

  // Calculate daily progress (7 days)
  const dailyProgress = Math.min((currentStreak / 7) * 100, 100);
  
  // Calculate monthly progress (30 days)
  const monthlyProgress = Math.min((currentStreak / 30) * 100, 100);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-b from-background via-[95%] via-background to-primary/5 px-4 py-2 md:py-8 md:pb-32">
      <div className="text-center space-y-3 max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 shadow-2xl shadow-yellow-500/50" style={{
          animation: 'golden-fade 2s ease-in-out infinite',
          backgroundSize: '200% 200%'
        }}>
          <Gift className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-black bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent tracking-tight">
          Recompensas Diárias
        </h1>
        <p className="text-lg text-muted-foreground font-semibold">Disponível em breve</p>
        
        <div className="pt-2">
          <Button 
            onClick={() => navigate('/')}
            className="bg-white text-black font-bold px-6 py-2 text-sm rounded-xl shadow-lg"
          >
            Ver Mercados
          </Button>
        </div>
      </div>
    </div>
  );
}
