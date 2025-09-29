import { useState, useEffect } from 'react';
import { Plus, Edit, CheckCircle, XCircle, Settings, Play, ArrowLeft } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMarkets } from '@/hooks/useMarkets';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Market } from '@/types';
import CreateMarketForm from '@/components/admin/CreateMarketForm';
import LiquidationModal from '@/components/admin/LiquidationModal';
import EditMarketModal from '@/components/admin/EditMarketModal';
import { OddsController } from '@/components/admin/OddsController';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

const AdminMarkets = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { toast } = useToast();
  const { data: markets = [], isLoading, refetch } = useMarkets();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [liquidationModal, setLiquidationModal] = useState<{
    isOpen: boolean;
    market: Market | null;
  }>({ isOpen: false, market: null });
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    market: Market | null;
  }>({ isOpen: false, market: null });
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  if (!user || !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

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
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Link>
              <h1 className="text-3xl font-bold mb-2">Gerenciar Mercados</h1>
              <p className="text-muted-foreground">
                Criar, editar e gerenciar mercados de análise
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="destructive" className="text-xs">
                ADMIN
              </Badge>
              <Button 
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="gap-2 shadow-success min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                Criar Mercado
              </Button>
            </div>
          </div>

          {/* Create Market Form */}
          {showCreateForm && (
            <CreateMarketForm 
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          {/* Markets List */}
          <Card className="bg-card-secondary border-border-secondary">
            <CardHeader>
              <CardTitle>Mercados da Plataforma</CardTitle>
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
                        >
                          <Play className="w-4 h-4" />
                          Reabrir
                        </Button>
                      )}
                    </div>

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
                        >
                          <CheckCircle className="w-4 h-4" />
                          Liquidar e Pagar
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

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
        </div>
      </div>
    </div>
  );
};

export default AdminMarkets;