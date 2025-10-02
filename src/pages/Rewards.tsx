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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 mb-4 animate-pulse">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
            Recompensas Diárias
          </h1>
          <p className="text-muted-foreground">Faça login todos os dias e ganhe RIOZ!</p>
        </div>

        {/* Current Streak Card */}
        <Card className="border-2 border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Flame className="w-6 h-6 text-yellow-500" />
              Sequência Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-2">
                {currentStreak}
              </div>
              <p className="text-lg text-muted-foreground">
                {currentStreak === 1 ? 'dia consecutivo' : 'dias consecutivos'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-yellow-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Maior Sequência</p>
                  <p className="text-2xl font-bold text-yellow-500">{longestStreak} dias</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-yellow-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-yellow-500/10">
                  <Calendar className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Logins</p>
                  <p className="text-2xl font-bold text-yellow-500">{totalLogins}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 7 Day Reward */}
        <Card className={`border-2 transition-all ${
          canClaim7Day 
            ? 'border-yellow-500 shadow-lg shadow-yellow-500/20 animate-pulse' 
            : hasClaimed7Day
            ? 'border-green-500/30 bg-green-500/5'
            : 'border-border'
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span>Recompensa Semanal</span>
              </div>
              <span className="text-2xl font-bold text-yellow-500">50 RIOZ</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span className="font-medium">{currentStreak}/7 dias</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-500"
                  style={{ width: `${dailyProgress}%` }}
                />
              </div>
            </div>
            
            <Button
              onClick={handleClaim7Day}
              disabled={!canClaim7Day || isClaiming || hasClaimed7Day}
              className={`w-full ${
                canClaim7Day 
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900' 
                  : ''
              }`}
              size="lg"
            >
              {hasClaimed7Day ? (
                <>✓ Recompensa Resgatada</>
              ) : canClaim7Day ? (
                <>🎁 Resgatar Recompensa</>
              ) : (
                <>🔒 {7 - currentStreak} dias restantes</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 30 Day Reward */}
        <Card className={`border-2 transition-all ${
          canClaim30Day 
            ? 'border-yellow-500 shadow-lg shadow-yellow-500/20 animate-pulse' 
            : hasClaimed30Day
            ? 'border-green-500/30 bg-green-500/5'
            : 'border-border'
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-500" />
                <span>Recompensa Mensal</span>
              </div>
              <span className="text-2xl font-bold text-yellow-500">200 RIOZ</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span className="font-medium">{currentStreak}/30 dias</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-500"
                  style={{ width: `${monthlyProgress}%` }}
                />
              </div>
            </div>
            
            <Button
              onClick={handleClaim30Day}
              disabled={!canClaim30Day || isClaiming || hasClaimed30Day}
              className={`w-full ${
                canClaim30Day 
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900' 
                  : ''
              }`}
              size="lg"
            >
              {hasClaimed30Day ? (
                <>✓ Recompensa Resgatada</>
              ) : canClaim30Day ? (
                <>🎁 Resgatar Recompensa</>
              ) : (
                <>🔒 {30 - currentStreak} dias restantes</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
          <CardContent className="pt-6">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">•</span>
                <span>Faça login todos os dias para manter sua sequência</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">•</span>
                <span>Recompensas podem ser resgatadas apenas uma vez</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-yellow-500 mt-0.5">•</span>
                <span>Se você perder um dia, sua sequência será reiniciada</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
