import { useState, useEffect } from 'react';
import { Plus, Edit, CheckCircle, XCircle, Settings, DollarSign, TrendingUp, Users, FileText, Play, Download, Shield, Activity, Newspaper, Menu } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useMarkets } from '@/hooks/useMarkets';
import { useMarketPools } from '@/hooks/useMarketPools';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Market } from '@/types';
import CreateMarketForm from '@/components/admin/CreateMarketForm';
import LiquidationModal from '@/components/admin/LiquidationModal';
import EditMarketModal from '@/components/admin/EditMarketModal';
import MarketTestModal from '@/components/admin/MarketTestModal';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { NewsManagement } from '@/components/admin/NewsManagement';
import { OddsController } from '@/components/admin/OddsController';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { toast } = useToast();
  const { data: markets = [], isLoading, refetch } = useMarkets();
  const { data: pools = {} } = useMarketPools();
  const [logs, setLogs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [liquidationModal, setLiquidationModal] = useState<{
    isOpen: boolean;
    market: Market | null;
  }>({ isOpen: false, market: null });
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    market: Market | null;
  }>({ isOpen: false, market: null });
  const [testModal, setTestModal] = useState<{
    isOpen: boolean;
  }>({ isOpen: false });
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user?.id && profile?.is_admin) {
      fetchAuditLogs();
    }
  }, [user?.id, profile?.is_admin]);

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    refetch();
  };

  const handleLiquidationSuccess = () => {
    setLiquidationModal({ isOpen: false, market: null });
    refetch();
  };

  const handleEditSuccess = () => {
    setEditModal({ isOpen: false, market: null });
    refetch();
  };

  const handleCloseMarket = async (marketId: string) => {
    try {
      const { error } = await supabase
        .from('markets')
        .update({ status: 'fechado' })
        .eq('id', marketId);

      if (error) throw error;

      toast({
        title: "Mercado fechado!",
        description: "O mercado foi fechado para novas análises.",
      });

      refetch();
    } catch (error) {
      console.error('Error closing market:', error);
      toast({
        title: "Erro",
        description: "Falha ao fechar mercado.",
        variant: "destructive"
      });
    }
  };

  const handleReopenMarket = async (marketId: string) => {
    try {
      const { error } = await supabase
        .from('markets')
        .update({ status: 'aberto' })
        .eq('id', marketId);

      if (error) throw error;

      toast({
        title: "Mercado reaberto!",
        description: "O mercado foi reaberto para novas análises.",
      });

      refetch();
    } catch (error) {
      console.error('Error reopening market:', error);
      toast({
        title: "Erro",
        description: "Falha ao reabrir mercado.",
        variant: "destructive"
      });
    }
  };

  // Security check
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Debug admin access
  console.log('Admin Access Debug:', {
    authLoading,
    profileLoading,
    user: !!user,
    userEmail: user?.email,
    profile: !!profile,
    isAdmin: profile?.is_admin,
    shouldRedirect: (!user || !profile?.is_admin)
  });

  // Check if user is admin
  if (!user || !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  // Calculate platform metrics from open markets
  const openMarkets = markets.filter(m => m.status === 'aberto');
  const totalPoolValue = Object.values(pools).reduce((sum, pool) => sum + pool.totalCoins, 0);
  const estimatedRevenue = totalPoolValue * 0.2;
  
  // Calculate total opinions placed across all markets
  const totalOpinions = Object.values(pools).reduce((sum, pool) => sum + pool.simCount + pool.naoCount, 0);
  const activeAnalysts = Object.values(pools).reduce((sum, pool) => sum + (pool.simCount > 0 || pool.naoCount > 0 ? 1 : 0), 0);

  const exportLogs = () => {
    const csvContent = `Tipo,Ação,Usuário,Data,Detalhes\n${logs.map(log => 
      `${log.type},${log.action},${log.user},${log.date},${log.details}`
    ).join('\n')}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'admin-logs.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Logs exportados!",
      description: "Arquivo CSV baixado com sucesso.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto':
        return 'bg-success-muted text-success';
      case 'fechado':
        return 'bg-muted text-muted-foreground';
      case 'liquidado':
        return 'bg-accent-muted text-accent';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 lg:ml-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="font-bold">Admin Panel</h1>
        </div>
        
        <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Administração</h1>
                {profile?.is_admin && (
                  <Badge variant="destructive" className="text-xs">
                    ADMIN
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1 max-w-[65ch]">
                Gerencie mercados, categorias, usuários e monitore métricas da plataforma
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="gap-2 shadow-success min-h-[44px]"
            aria-label="Criar novo mercado de análise"
          >
            <Plus className="w-4 h-4" />
            Criar Mercado
          </Button>
        </div>

        {/* Test E2E Section */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-2">Teste E2E - Correção de Bloqueadores</h3>
                  <p className="text-sm text-muted-foreground">
                    Verificar se mercados three-way, multi-opção e liquidação com "Empate" funcionam corretamente.
                  </p>
                </div>
                <Button
                  onClick={() => setTestModal({ isOpen: true })}
                  variant="outline"
                  className="gap-2 min-h-[44px]"
                  aria-label="Executar testes end-to-end do sistema"
                >
                  <Play className="w-4 h-4" />
                  Executar Testes
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <DollarSign className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pool Total</p>
                  <p className="text-2xl font-bold">{totalPoolValue.toLocaleString()} Rioz Coin</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receita Estimada</p>
                  <p className="text-2xl font-bold">{Math.round(estimatedRevenue).toLocaleString()} Rioz Coin</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <CheckCircle className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Análises</p>
                  <p className="text-2xl font-bold">{totalOpinions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-danger/10">
                  <Users className="w-5 h-5 text-danger" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Analistas Ativos</p>
                  <p className="text-2xl font-bold">{activeAnalysts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Market Form */}
        {showCreateForm && (
          <CreateMarketForm 
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {/* Admin Tabs */}
        <Tabs defaultValue="markets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="markets" aria-label="Gerenciar mercados de análise">
              <Settings className="w-4 h-4 mr-2" />
              Mercados
            </TabsTrigger>
            <TabsTrigger value="users" aria-label="Gerenciar usuários e analistas">
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="categories" aria-label="Gerenciar categorias">
              <FileText className="w-4 h-4 mr-2" />
              Categorias
            </TabsTrigger>
            <TabsTrigger value="news" aria-label="Gerenciar notícias">
              <Newspaper className="w-4 h-4 mr-2" />
              Notícias
            </TabsTrigger>
            <TabsTrigger value="revenue" aria-label="Ver receita da plataforma">
              <DollarSign className="w-4 h-4 mr-2" />
              Receita
            </TabsTrigger>
            <TabsTrigger value="logs" aria-label="Ver logs e auditoria">
              <Activity className="w-4 h-4 mr-2" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="markets">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciar Mercados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  markets.map(market => (
                    <div key={market.id} className="p-4 rounded-lg border border-border bg-card/50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{market.titulo}</h3>
                            <Badge className={getStatusColor(market.status)}>
                              {market.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{market.descricao}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Categoria: {market.categoria}</span>
                            <span>Encerra: {new Date(market.end_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {market.opcoes.map((opcao, index) => (
                          <div key={index} className="p-3 rounded border border-border/50">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{opcao}</span>
                              <span className="text-sm text-muted-foreground">
                                {market.odds?.[opcao] || 1.5}x recompensa
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2 min-h-[44px]"
                          onClick={() => setEditModal({ isOpen: true, market })}
                          aria-label={`Editar mercado ${market.titulo}`}
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </Button>
                        {market.status === 'aberto' ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 min-h-[44px] hover:bg-danger/10"
                            onClick={() => handleCloseMarket(market.id)}
                            aria-label={`Fechar mercado ${market.titulo} para novas análises`}
                          >
                            <XCircle className="w-4 h-4" />
                            Fechar
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 min-h-[44px] hover:bg-success/10 text-success border-success"
                            onClick={() => handleReopenMarket(market.id)}
                            aria-label={`Reabrir mercado ${market.titulo}`}
                          >
                            <Play className="w-4 h-4" />
                            Reabrir
                          </Button>
                        )}
                      </div>

                      {/* Odds Controller for all markets (for editing) */}
                      <OddsController 
                        market={market} 
                        onOddsUpdate={refetch}
                      />

                      {market.status === 'fechado' && (
                        <div className="space-y-3">
                          <div className="text-sm font-medium">Liquidar Mercado:</div>
                          <Button
                            size="sm"
                            onClick={() => setLiquidationModal({ isOpen: true, market })}
                            className="gap-2 shadow-success min-h-[44px]"
                            aria-label={`Liquidar mercado ${market.titulo} e distribuir recompensas`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Liquidar Mercado
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Usuários da Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full min-h-[44px]" aria-label="Acessar painel completo de gerenciamento de usuários">
                  <Link to="/admin/users">
                    <Users className="w-5 h-5 mr-2" />
                    Acessar Gerenciamento Completo
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Categorias de Mercados</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full min-h-[44px]" aria-label="Acessar painel completo de gerenciamento de categorias">
                  <Link to="/admin/categories">
                    <Settings className="w-5 h-5 mr-2" />
                    Acessar Gerenciamento Completo
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="news">
            <NewsManagement />
          </TabsContent>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Receita da Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full min-h-[44px]" aria-label="Acessar página de receita detalhada">
                  <Link to="/admin/revenue">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Ver Receita Detalhada
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Logs de Auditoria</CardTitle>
                <Button 
                  onClick={exportLogs}
                  variant="outline"
                  className="gap-2 min-h-[44px]"
                  aria-label="Exportar logs de auditoria em formato CSV"
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {auditLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium mb-2">Nenhum log disponível</p>
                    <p className="text-sm">Os logs de ações administrativas aparecerão aqui</p>
                  </div>
                ) : (
                  auditLogs.map((log, index) => (
                    <div key={index} className="p-4 rounded-lg border border-border bg-card/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{log.action}</Badge>
                          <span className="font-medium">{log.resource_type}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>Recurso: {log.resource_id}</p>
                        {log.old_values && (
                          <p>Antes: {JSON.stringify(log.old_values)}</p>
                        )}
                        {log.new_values && (
                          <p>Depois: {JSON.stringify(log.new_values)}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <LiquidationModal
          market={liquidationModal.market}
          isOpen={liquidationModal.isOpen}
          onClose={() => setLiquidationModal({ isOpen: false, market: null })}
          onSuccess={handleLiquidationSuccess}
        />

        <EditMarketModal
          market={editModal.market}
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, market: null })}
          onSuccess={handleEditSuccess}
        />

        <MarketTestModal
          isOpen={testModal.isOpen}
          onClose={() => setTestModal({ isOpen: false })}
        />
        </div>
      </div>
    </div>
  );
};

export default Admin;