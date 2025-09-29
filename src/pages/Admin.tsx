import { useState, useEffect } from 'react';
import { Plus, Shield, DollarSign, TrendingUp, Users, FileText, Newspaper, Activity, Settings, Menu } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMarkets } from '@/hooks/useMarkets';
import { useMarketPools } from '@/hooks/useMarketPools';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import CreateMarketForm from '@/components/admin/CreateMarketForm';
import LiquidationModal from '@/components/admin/LiquidationModal';
import EditMarketModal from '@/components/admin/EditMarketModal';
import MarketTestModal from '@/components/admin/MarketTestModal';
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
    market: any | null;
  }>({ isOpen: false, market: null });
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    market: any | null;
  }>({ isOpen: false, market: null });
  const [testModal, setTestModal] = useState<{
    isOpen: boolean;
  }>({ isOpen: false });
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

  // Security check
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
            <Card className="bg-card-secondary border-border-secondary">
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
                    <Settings className="w-4 h-4" />
                    Executar Testes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card-secondary border-border-secondary">
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

            <Card className="bg-card-secondary border-border-secondary">
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

            <Card className="bg-card-secondary border-border-secondary">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Activity className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Análises</p>
                    <p className="text-2xl font-bold">{totalOpinions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card-secondary border-border-secondary">
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

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link to="/admin/markets">
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-card-secondary border-border-secondary">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Settings className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Gerenciar Mercados</h3>
                      <p className="text-sm text-muted-foreground">Criar e administrar mercados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin/users">
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-card-secondary border-border-secondary">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Users className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Usuários</h3>
                      <p className="text-sm text-muted-foreground">Administrar usuários</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin/categories">
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-card-secondary border-border-secondary">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <FileText className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Categorias</h3>
                      <p className="text-sm text-muted-foreground">Gerenciar categorias</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin/news">
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-card-secondary border-border-secondary">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-danger/10">
                      <Newspaper className="w-5 h-5 text-danger" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Notícias</h3>
                      <p className="text-sm text-muted-foreground">Gerenciar notícias</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin/revenue">
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-card-secondary border-border-secondary">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <DollarSign className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Receita</h3>
                      <p className="text-sm text-muted-foreground">Análise de receitas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/admin/logs">
              <Card className="hover:shadow-md transition-shadow cursor-pointer bg-card-secondary border-border-secondary">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-info/10">
                      <Activity className="w-5 h-5 text-info" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Logs</h3>
                      <p className="text-sm text-muted-foreground">Auditoria e logs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Modals */}
          <LiquidationModal
            isOpen={liquidationModal.isOpen}
            market={liquidationModal.market}
            onClose={() => setLiquidationModal({ isOpen: false, market: null })}
            onSuccess={handleLiquidationSuccess}
          />

          <EditMarketModal
            isOpen={editModal.isOpen}
            market={editModal.market}
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