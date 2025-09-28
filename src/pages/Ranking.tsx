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
  const sortedUsers = [...fakeUsers].sort((a, b) => b.saldo_moeda - a.saldo_moeda);
  
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
    } else if (balance <= 5000) {
      return {
        current: 'analista',
        progress: ((balance - 1500) / (5000 - 1500)) * 100,
        nextLevel: 'guru',
        nextLevelRequirement: 5000,
        currentBalance: balance
      };
    } else {
      return {
        current: 'guru',
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Analistas</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalUsers}
                  </p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Volume Total</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalVolume.toLocaleString()} RZ
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Precisão Média</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.averageAccuracy}%
                  </p>
                </div>
                <Target className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-primary border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/80 text-sm">Líder Atual</p>
                  <p className="text-2xl font-bold text-primary-foreground">
                    {sortedUsers[0]?.saldo_moeda.toLocaleString() || '0'} RZ
                  </p>
                </div>
                <Award className="w-8 h-8 text-primary-foreground/60" />
              </div>
            </CardContent>
          </Card>
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
                <p className="text-sm text-muted-foreground">1.501 - 5.000 Rioz Coin</p>
              </div>
              <div className="p-4 rounded-lg bg-primary-glow/20 border border-primary/20">
                <Badge className="mb-2 bg-primary-glow/20 text-primary">Guru</Badge>
                <p className="text-sm text-muted-foreground">5.001+ Rioz Coin</p>
              </div>
              <div className="p-4 rounded-lg bg-danger-muted border border-danger/20">
                <Badge className="mb-2 bg-danger-muted text-danger">Root</Badge>
                <p className="text-sm text-muted-foreground">Admin</p>
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
          <CardContent className="space-y-4">
            {sortedUsers.map((user, index) => (
              <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-card/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.avatar} alt={user.nome} />
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {user.nome.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{user.nome}</h3>
                      {getLevelBadge(user.nivel)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Precisão: <span className="text-success font-medium">{((user.analises_certas / user.total_analises) * 100).toFixed(1)}%</span></span>
                      <span>({user.analises_certas}/{user.total_analises})</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-lg">{user.saldo_moeda.toLocaleString()} RZ</div>
                  <div className="text-sm text-muted-foreground">
                    Ganho: <span className="text-success">+{user.ganho_total.toLocaleString()} RZ</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Depositado: {user.total_depositado.toLocaleString()} RZ
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