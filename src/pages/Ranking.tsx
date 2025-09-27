import { Trophy, TrendingUp, Users, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import UserRankItem from '@/components/ranking/UserRankItem';
import { useUsers } from '@/hooks/useUsers';

const Ranking = () => {
  const { data: users = [], isLoading } = useUsers();
  const sortedUsers = [...users].sort((a, b) => b.saldo_moeda - a.saldo_moeda);
  
  const stats = {
    currentPosition: 1,
    totalUsers: users.length,
    averageBalance: Math.round(users.reduce((sum, user) => sum + user.saldo_moeda, 0) / users.length || 0)
  };

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="w-8 h-8 text-primary" />
            <h1 className="text-5xl font-bold">Ranking de Analistas</h1>
          </div>
          <p className="text-muted-foreground max-w-[65ch] mx-auto">
            Veja como você se compara com outros analistas da plataforma. 
            Suba no ranking fazendo análises certeiras!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total de Analistas</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.totalUsers.toLocaleString()}
                  </p>
                </div>
                <Users className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Saldo Médio</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.averageBalance.toLocaleString()}
                  </p>
                  <p className="text-muted-foreground text-xs">Rioz Coin</p>
                </div>
                <Trophy className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-primary border-primary/20 shadow-success">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-primary-foreground/80 text-sm">Líder Atual</p>
                  <p className="text-2xl font-bold text-primary-foreground">
                    {sortedUsers[0]?.saldo_moeda.toLocaleString() || '0'}
                  </p>
                  <p className="text-primary-foreground/60 text-xs">Rioz Coin</p>
                </div>
                <Award className="w-8 h-8 text-primary-foreground/60" />
              </div>
            </CardContent>
          </Card>
        </div>

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
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              sortedUsers.map((user, index) => (
                <UserRankItem 
                  key={user.id} 
                  user={user} 
                  position={index + 1}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Ranking;