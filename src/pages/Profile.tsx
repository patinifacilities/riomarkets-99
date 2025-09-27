import { useParams } from 'react-router-dom';
import { User, Trophy, TrendingUp, Calendar, Target, Settings, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfile, useProfiles } from '@/hooks/useProfile';
import { useUserOrders, useWalletTransactions } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import TransactionItem from '@/components/wallet/TransactionItem';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(userId);
  const { data: orders = [], isLoading: ordersLoading } = useUserOrders(userId);
  const { data: transactions = [], isLoading: transactionsLoading } = useWalletTransactions(userId);
  const { data: allProfiles = [] } = useProfiles();
  
  const isOwnProfile = currentUser?.id === userId;

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Usuário não encontrado</h2>
          <p className="text-muted-foreground">Este perfil não existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  const winningOrders = orders.filter(order => order.status === 'ganha');
  const losingOrders = orders.filter(order => order.status === 'perdida');
  const activeOrders = orders.filter(order => order.status === 'ativa');
  
  const winRate = orders.length > 0 ? Math.round((winningOrders.length / (winningOrders.length + losingOrders.length)) * 100) || 0 : 0;
  const totalBets = orders.length;

  // Calculate ranking position
  const sortedProfiles = allProfiles.sort((a, b) => b.saldo_moeda - a.saldo_moeda);
  const userRankingPosition = sortedProfiles.findIndex(p => p.id === userId) + 1;

  // Format account creation date
  const formatMemberSince = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const getLevelColor = (level: string) => {
    const colors = {
      'iniciante': 'bg-gray-500/20 text-gray-300',
      'analista': 'bg-accent-muted text-accent',
      'guru': 'bg-primary-glow/20 text-primary',
      'root': 'bg-danger-muted text-danger'
    };
    return colors[level as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2">
            {isOwnProfile ? 'Meu Perfil' : `Perfil de ${profile.nome}`}
          </h1>
          <p className="text-muted-foreground max-w-[65ch] mx-auto">
            Gerencie suas informações e acompanhe seu desempenho como analista
          </p>
        </div>
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">
                  {profile.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
              
               <div className="flex-1">
                 <h2 className="text-3xl font-bold mb-2">{profile.nome}</h2>
                 <p className="text-muted-foreground mb-1">{profile.email}</p>
                 <p className="text-sm text-muted-foreground mb-3">
                   Membro desde {formatMemberSince(profile.created_at)}
                 </p>
                 <div className="flex items-center gap-3">
                   <Badge className={getLevelColor(profile.nivel)} variant="secondary">
                     {profile.nivel}
                   </Badge>
                   {profile.is_admin && (
                     <Badge variant="destructive">Admin</Badge>
                   )}
                 </div>
               </div>

               <div className="flex items-center gap-4">
                 <div className="text-right">
                   <p className="text-3xl font-bold text-primary">{profile.saldo_moeda.toLocaleString()}</p>
                   <p className="text-muted-foreground">Rioz Coin</p>
                 </div>
                 {isOwnProfile && (
                   <Button 
                     variant="outline"
                     className="min-h-[44px] px-4 py-2 bg-[#FF1493] hover:bg-[#FF1493]/90 text-white border-[#FF1493] hover:border-[#FF1493]/90"
                     aria-label="Editar perfil"
                   >
                     <Edit className="w-4 h-4 mr-2" />
                     Editar Perfil
                   </Button>
                 )}
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Análises</p>
                  <p className="text-2xl font-bold">{totalBets}</p>
                </div>
                <Target className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Taxa de Acerto</p>
                  <p className="text-2xl font-bold text-success">{winRate}%</p>
                </div>
                <Trophy className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Vitórias</p>
                  <p className="text-2xl font-bold text-success">{winningOrders.length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

           <Card>
             <CardContent className="p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-muted-foreground text-sm">Ativas</p>
                   <p className="text-2xl font-bold text-primary">{activeOrders.length}</p>
                 </div>
                 <Calendar className="w-8 h-8 text-primary" />
               </div>
             </CardContent>
           </Card>

           <Card>
             <CardContent className="p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-muted-foreground text-sm">Posição no Ranking</p>
                   <p className="text-2xl font-bold text-[#00FF91]">
                     {userRankingPosition > 0 ? `#${userRankingPosition}` : '-'}
                   </p>
                 </div>
                 <Trophy className="w-8 h-8 text-[#00FF91]" />
               </div>
             </CardContent>
           </Card>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="analyses" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analyses" aria-label="Ver histórico de análises">
              Minhas Análises
            </TabsTrigger>
            <TabsTrigger value="transactions" aria-label="Ver histórico de transações">
              Transações
            </TabsTrigger>
            <TabsTrigger value="settings" aria-label="Acessar configurações">
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyses" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Histórico de Análises
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Você ainda não participou de nenhum mercado</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Continue analisando para subir no ranking
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div 
                        key={order.id} 
                        className="flex items-center justify-between p-4 rounded-lg bg-card border border-border"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <Badge 
                              variant={
                                order.status === 'ganha' ? 'default' : 
                                order.status === 'perdida' ? 'destructive' : 
                                'secondary'
                              }
                              className={
                                order.status === 'ganha' ? 'bg-success text-success-foreground' :
                                order.status === 'perdida' ? 'bg-danger text-danger-foreground' :
                                'bg-accent text-accent-foreground'
                              }
                            >
                              {order.status === 'ganha' ? 'Vitória' : 
                               order.status === 'perdida' ? 'Derrota' : 
                               'Ativa'}
                            </Badge>
                            <span className="font-medium">{order.opcao_escolhida}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Market ID: {order.market_id}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{order.quantidade_moeda.toLocaleString()} Rioz Coin</p>
                          <p className="text-sm text-muted-foreground">Recompensa: {order.preco}x</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Histórico de Transações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhuma transação encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map(transaction => (
                      <TransactionItem 
                        key={transaction.id} 
                        transaction={transaction} 
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configurações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Configurações em desenvolvimento</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Em breve você poderá personalizar suas preferências
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;