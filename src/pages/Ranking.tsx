import { Trophy, TrendingUp, Users, Award, Target, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { fakeUsers } from '@/data/fake-users';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

const Ranking = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const sortedUsers = [...fakeUsers, ...fakeUsers].sort((a, b) => b.saldo_moeda - a.saldo_moeda).slice(0, 25);
  
  const stats = {
    totalUsers: fakeUsers.length,
    averageBalance: Math.round(fakeUsers.reduce((sum, user) => sum + user.saldo_moeda, 0) / fakeUsers.length),
    totalVolume: fakeUsers.reduce((sum, user) => sum + user.total_depositado, 0),
    averageAccuracy: Math.round(fakeUsers.reduce((sum, user) => sum + (user.analises_certas / user.total_analises * 100), 0) / fakeUsers.length)
  };

  const getLevelBadge = (nivel: string) => {
    switch (nivel) {
      case 'guru':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Guru</Badge>;
      case 'analista':
        return <Badge className="bg-accent/20 text-accent border-accent/30">Analista</Badge>;
      case 'iniciante':
        return <Badge className="bg-muted text-muted-foreground">Iniciante</Badge>;
      default:
        return <Badge variant="outline">Usuário</Badge>;
    }
  };

  const getUserLevelProgress = (balance: number) => {
    if (balance <= 1500) {
      return {
        current: 'iniciante',
        progress: (balance / 1500) * 100,
        nextLevel: 'analista',
        nextLevelRequirement: 1500,
        currentBalance: balance
      };
    } else if (balance <= 100000) {
      return {
        current: 'analista',
        progress: ((balance - 1500) / (100000 - 1500)) * 100,
        nextLevel: 'guru',
        nextLevelRequirement: 100000,
        currentBalance: balance
      };
    } else if (balance <= 500000) {
      return {
        current: 'guru',
        progress: ((balance - 100000) / (500000 - 100000)) * 100,
        nextLevel: 'mestre',
        nextLevelRequirement: 500000,
        currentBalance: balance
      };
    } else {
      return {
        current: 'mestre',
        progress: 100,
        nextLevel: null,
        nextLevelRequirement: null,
        currentBalance: balance
      };
    }
  };

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Ranking de Analistas</h1>
          </div>
          <p className="text-muted-foreground max-w-[65ch] mx-auto">
            Conheça os melhores analistas da plataforma e suas estatísticas de desempenho
          </p>
        </div>


        {/* User Progress Section */}
        {profile && (
          <Card className="mb-8 bg-gradient-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Meu Progresso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={profile.profile_pic_url} alt={profile.nome} />
                  <AvatarFallback className="bg-primary/20 text-primary text-lg">
                    {profile.nome.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{profile.nome}</h3>
                    {profile.username && (
                      <span className="text-sm text-muted-foreground">@{profile.username}</span>
                    )}
                    {getLevelBadge(profile.nivel)}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Saldo atual: <span className="font-semibold text-primary">{profile.saldo_moeda.toLocaleString()} RZ</span></span>
                      {getUserLevelProgress(profile.saldo_moeda).nextLevel && (
                        <span>Próximo nível: <span className="font-semibold">{getUserLevelProgress(profile.saldo_moeda).nextLevelRequirement?.toLocaleString()} RZ</span></span>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progresso para {getUserLevelProgress(profile.saldo_moeda).nextLevel || 'Guru'}</span>
                        <span>{Math.round(getUserLevelProgress(profile.saldo_moeda).progress)}%</span>
                      </div>
                      <Progress 
                        value={getUserLevelProgress(profile.saldo_moeda).progress} 
                        className="h-3"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Level Badges */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Níveis de Analista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-gray-500/10 border border-gray-500/20">
                <Badge className="mb-2 bg-gray-500/20 text-gray-300">Iniciante</Badge>
                <p className="text-sm text-muted-foreground">0 - 1.500 Rioz Coin</p>
              </div>
              <div className="p-4 rounded-lg bg-accent-muted border border-accent/20">
                <Badge className="mb-2 bg-accent-muted text-accent">Analista</Badge>
                <p className="text-sm text-muted-foreground">1.5K - 100K Rioz Coin</p>
              </div>
              <div className="p-4 rounded-lg bg-primary-glow/20 border border-primary/20">
                <Badge className="mb-2 bg-primary-glow/20 text-primary">Guru</Badge>
                <p className="text-sm text-muted-foreground">100K+ Rioz Coin</p>
              </div>
              <div className="p-4 rounded-lg bg-danger-muted border border-danger/20">
                <Badge className="mb-2 bg-danger-muted text-danger">Mestre</Badge>
                <p className="text-sm text-muted-foreground">500K+ Rioz Coin</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ranking List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Ranking Geral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sortedUsers.map((user, index) => (
              <div key={`${user.id}-${index}`} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-card/50 transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.avatar} alt={user.nome} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {user.nome.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{user.nome}</h3>
                      {getLevelBadge(user.nivel)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Precisão: <span className="text-success font-medium">{((user.analises_certas / user.total_analises) * 100).toFixed(1)}%</span> • ({user.analises_certas}/{user.total_analises})
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-sm">{user.saldo_moeda.toLocaleString()} RZ</div>
                  <div className="text-xs text-muted-foreground">
                    +{user.ganho_total.toLocaleString()} RZ
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Ranking;