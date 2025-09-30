import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

interface PoolConfig {
  id?: string;
  asset_symbol: string;
  asset_name: string;
  category: string;
  question: string;
  api_url?: string;
  api_connected: boolean;
  base_odds: number;
}

const AdminFastPoolConfig = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [poolConfigs, setPoolConfigs] = useState<PoolConfig[]>([]);
  const [newConfig, setNewConfig] = useState<PoolConfig>({
    asset_symbol: '',
    asset_name: '',
    category: 'crypto',
    question: '',
    api_url: '',
    api_connected: false,
    base_odds: 1.65
  });

  useEffect(() => {
    if (user) {
      loadPoolConfigs();
    }
  }, [user]);

  const loadPoolConfigs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fast_pools')
        .select('id, asset_symbol, asset_name, category, question, api_url, api_connected, base_odds')
        .order('category', { ascending: true })
        .order('asset_symbol', { ascending: true });

      if (error) throw error;

      // Group by unique config (category + asset_symbol)
      const uniqueConfigs = new Map();
      data?.forEach((pool: any) => {
        const key = `${pool.category}-${pool.asset_symbol}`;
        if (!uniqueConfigs.has(key)) {
          uniqueConfigs.set(key, pool);
        }
      });

      setPoolConfigs(Array.from(uniqueConfigs.values()));
    } catch (error) {
      console.error('Error loading pool configs:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (config: PoolConfig) => {
    try {
      setSaving(true);

      // Update all pools with this asset_symbol and category
      const { error } = await supabase
        .from('fast_pools')
        .update({
          asset_name: config.asset_name,
          question: config.question,
          api_url: config.api_url || null,
          api_connected: config.api_connected,
          base_odds: config.base_odds
        })
        .eq('asset_symbol', config.asset_symbol)
        .eq('category', config.category);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configuração atualizada",
      });

      loadPoolConfigs();
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar configuração",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateConfig = async () => {
    try {
      if (!newConfig.asset_symbol || !newConfig.asset_name) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios",
          variant: "destructive"
        });
        return;
      }

      setSaving(true);

      // Check if config already exists
      const { data: existing } = await supabase
        .from('fast_pools')
        .select('id')
        .eq('asset_symbol', newConfig.asset_symbol)
        .eq('category', newConfig.category)
        .limit(1);

      if (existing && existing.length > 0) {
        toast({
          title: "Erro",
          description: "Pool já existe para este ativo e categoria",
          variant: "destructive"
        });
        return;
      }

      // Create first pool round for this config
      const { error } = await supabase
        .from('fast_pools')
        .insert({
          asset_symbol: newConfig.asset_symbol,
          asset_name: newConfig.asset_name,
          category: newConfig.category,
          question: newConfig.question,
          api_url: newConfig.api_url || null,
          api_connected: newConfig.api_connected,
          base_odds: newConfig.base_odds,
          round_number: 1,
          status: 'active',
          round_start_time: new Date().toISOString(),
          round_end_time: new Date(Date.now() + 60000).toISOString(),
          opening_price: 0
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Pool criado com sucesso",
      });

      // Reset form
      setNewConfig({
        asset_symbol: '',
        asset_name: '',
        category: 'crypto',
        question: '',
        api_url: '',
        api_connected: false,
        base_odds: 1.65
      });

      loadPoolConfigs();
    } catch (error) {
      console.error('Error creating config:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar pool",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfig = async (config: PoolConfig) => {
    if (!confirm(`Tem certeza que deseja deletar ${config.asset_name}? Isso removerá todos os rounds deste pool.`)) {
      return;
    }

    try {
      // Delete all pools with this config
      const { error } = await supabase
        .from('fast_pools')
        .delete()
        .eq('asset_symbol', config.asset_symbol)
        .eq('category', config.category);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Pool deletado",
      });

      loadPoolConfigs();
    } catch (error) {
      console.error('Error deleting config:', error);
      toast({
        title: "Erro",
        description: "Falha ao deletar pool",
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

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 lg:ml-0 min-w-0">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link to="/admin/fast" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Link>
              <h1 className="text-3xl font-bold mb-2">Configuração Central de Pools</h1>
              <p className="text-muted-foreground">
                Gerencie todos os pools Fast Markets
              </p>
            </div>
          </div>

          {/* Create New Pool */}
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Criar Novo Pool
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Símbolo do Ativo *</Label>
                  <Input
                    value={newConfig.asset_symbol}
                    onChange={(e) => setNewConfig({ ...newConfig, asset_symbol: e.target.value.toUpperCase() })}
                    placeholder="BTC, ETH, OIL, etc"
                  />
                </div>

                <div>
                  <Label>Nome do Ativo *</Label>
                  <Input
                    value={newConfig.asset_name}
                    onChange={(e) => setNewConfig({ ...newConfig, asset_name: e.target.value })}
                    placeholder="Bitcoin, Ethereum, Petróleo, etc"
                  />
                </div>

                <div>
                  <Label>Categoria *</Label>
                  <Select value={newConfig.category} onValueChange={(value) => setNewConfig({ ...newConfig, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crypto">Cripto</SelectItem>
                      <SelectItem value="commodities">Commodities</SelectItem>
                      <SelectItem value="forex">Forex</SelectItem>
                      <SelectItem value="stocks">Ações</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Odds Base</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newConfig.base_odds}
                    onChange={(e) => setNewConfig({ ...newConfig, base_odds: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>Pergunta</Label>
                  <Input
                    value={newConfig.question}
                    onChange={(e) => setNewConfig({ ...newConfig, question: e.target.value })}
                    placeholder="O preço vai subir ou descer?"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label>URL da API (opcional)</Label>
                  <Input
                    value={newConfig.api_url}
                    onChange={(e) => setNewConfig({ ...newConfig, api_url: e.target.value })}
                    placeholder="https://api.exemplo.com/price"
                  />
                </div>
              </div>

              <Button onClick={handleCreateConfig} disabled={saving} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Criar Pool
              </Button>
            </CardContent>
          </Card>

          {/* Existing Pools */}
          <Card>
            <CardHeader>
              <CardTitle>Pools Configurados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : poolConfigs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum pool configurado
                </div>
              ) : (
                poolConfigs.map((config, index) => (
                  <div key={`${config.category}-${config.asset_symbol}`} className="p-4 rounded-lg border border-border space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{config.asset_name}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteConfig(config)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Símbolo</Label>
                        <Input value={config.asset_symbol} disabled />
                      </div>

                      <div>
                        <Label>Nome do Ativo</Label>
                        <Input
                          value={config.asset_name}
                          onChange={(e) => {
                            const updated = [...poolConfigs];
                            updated[index].asset_name = e.target.value;
                            setPoolConfigs(updated);
                          }}
                        />
                      </div>

                      <div>
                        <Label>Categoria</Label>
                        <Input value={config.category} disabled />
                      </div>

                      <div>
                        <Label>Odds Base</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={config.base_odds}
                          onChange={(e) => {
                            const updated = [...poolConfigs];
                            updated[index].base_odds = parseFloat(e.target.value);
                            setPoolConfigs(updated);
                          }}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label>Pergunta</Label>
                        <Input
                          value={config.question}
                          onChange={(e) => {
                            const updated = [...poolConfigs];
                            updated[index].question = e.target.value;
                            setPoolConfigs(updated);
                          }}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label>URL da API</Label>
                        <Input
                          value={config.api_url || ''}
                          onChange={(e) => {
                            const updated = [...poolConfigs];
                            updated[index].api_url = e.target.value;
                            updated[index].api_connected = !!e.target.value;
                            setPoolConfigs(updated);
                          }}
                          placeholder="https://api.exemplo.com/price"
                        />
                      </div>
                    </div>

                    <Button onClick={() => handleSaveConfig(config)} disabled={saving} className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Alterações
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminFastPoolConfig;
