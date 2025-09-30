import { Trophy, TrendingUp, Users, Award, Target, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { fakeUsers } from '@/data/fake-users';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useState } from 'react';

const Ranking = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const [showLevelsModal, setShowLevelsModal] = useState(false);
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
          <Card className="mb-8 bg-gradient-primary/10 border-primary/20 cursor-pointer hover:bg-gradient-primary/15 transition-colors" onClick={() => setShowLevelsModal(true)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Meu Progresso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={profile.profile_pic_url} alt={profile.nome || 'Usuário'} />
                  <AvatarFallback className="bg-primary/20 text-primary text-lg">
                    {profile.nome ? profile.nome.split(' ').map(n => n[0]).join('') : 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{profile.nome || 'Usuário'}</h3>
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

        {/* Levels Modal */}
        <Dialog open={showLevelsModal} onOpenChange={setShowLevelsModal}>
          <DialogContent className="sm:max-w-4xl max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <Award className="w-6 h-6 text-primary" />
                Níveis de Analista
              </DialogTitle>
            </DialogHeader>
            
            {/* User Progress Bar */}
            {profile && (
              <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <h3 className="text-lg font-semibold mb-2">Seu Progresso</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Nível atual: <span className="font-semibold text-primary">{getUserLevelProgress(profile.saldo_moeda).current}</span></span>
                    <span>Saldo: <span className="font-semibold">{profile.saldo_moeda.toLocaleString()} RZ</span></span>
                  </div>
                  
                  {getUserLevelProgress(profile.saldo_moeda).nextLevel && (
                    <>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Próximo nível: {getUserLevelProgress(profile.saldo_moeda).nextLevel}</span>
                        <span>{Math.round(getUserLevelProgress(profile.saldo_moeda).progress)}%</span>
                      </div>
                      <Progress 
                        value={getUserLevelProgress(profile.saldo_moeda).progress} 
                        className="h-3"
                      />
                      <div className="text-xs text-muted-foreground">
                        Faltam {(getUserLevelProgress(profile.saldo_moeda).nextLevelRequirement! - profile.saldo_moeda).toLocaleString()} RZ para o próximo nível
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="p-6 rounded-xl bg-gradient-to-br from-gray-500/10 to-gray-600/5 border border-gray-500/20 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gray-500/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-gray-400" />
                  </div>
                  <Badge className="bg-gray-500/20 text-gray-300 px-3 py-1 text-sm font-semibold">Iniciante</Badge>
                </div>
                <p className="text-sm text-muted-foreground font-medium">0 - 1.500 Rioz Coin</p>
                <p className="text-xs text-muted-foreground/70 mt-2">Primeiros passos no mercado</p>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-accent" />
                  </div>
                  <Badge className="bg-accent/20 text-accent px-3 py-1 text-sm font-semibold">Analista</Badge>
                </div>
                <p className="text-sm text-muted-foreground font-medium">1.5K - 100K Rioz Coin</p>
                <p className="text-xs text-muted-foreground/70 mt-2">Análises consistentes</p>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <Badge className="bg-primary/20 text-primary px-3 py-1 text-sm font-semibold">Guru</Badge>
                </div>
                <p className="text-sm text-muted-foreground font-medium">100K+ Rioz Coin</p>
                <p className="text-xs text-muted-foreground/70 mt-2">Expert em predições</p>
              </div>
              <div className="p-6 rounded-xl bg-gradient-to-br from-danger/10 to-danger/5 border border-danger/20 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-danger/20 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-danger" />
                  </div>
                  <Badge className="bg-danger/20 text-danger px-3 py-1 text-sm font-semibold">Mestre</Badge>
                </div>
                <p className="text-sm text-muted-foreground font-medium">500K+ Rioz Coin</p>
                <p className="text-xs text-muted-foreground/70 mt-2">Elite dos analistas</p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={() => setShowLevelsModal(false)}>Fechar</Button>
            </div>
          </DialogContent>
        </Dialog>

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