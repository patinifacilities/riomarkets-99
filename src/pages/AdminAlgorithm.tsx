import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Save, TrendingUp, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

const AdminAlgorithm = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [algorithmConfig, setAlgorithmConfig] = useState({
    pool_duration_seconds: 60,
    odds_start: 1.80,
    odds_end: 1.10,
    odds_curve_intensity: 0.60,
    lockout_time_seconds: 15,
    max_odds: 5.00,
    min_odds: 1.05
  });

  useEffect(() => {
    loadAlgorithmConfig();
  }, []);

  const loadAlgorithmConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('fast_pool_algorithm_config')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setAlgorithmConfig({
          pool_duration_seconds: data.pool_duration_seconds,
          odds_start: Number(data.odds_start),
          odds_end: Number(data.odds_end),
          odds_curve_intensity: Number(data.odds_curve_intensity),
          lockout_time_seconds: data.lockout_time_seconds,
          max_odds: Number(data.max_odds),
          min_odds: Number(data.min_odds)
        });
      }
    } catch (error) {
      console.error('Error loading algorithm config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Get the existing config
      const { data: existing } = await supabase
        .from('fast_pool_algorithm_config')
        .select('id')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (existing) {
        // Update existing config
        const { error } = await supabase
          .from('fast_pool_algorithm_config')
          .update(algorithmConfig)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new config
        const { error } = await supabase
          .from('fast_pool_algorithm_config')
          .insert([algorithmConfig]);

        if (error) throw error;
      }

      toast({
        title: "Algoritmo atualizado",
        description: "As configurações serão aplicadas aos próximos pools",
      });
    } catch (error) {
      console.error('Error saving algorithm config:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 lg:ml-0 min-w-0">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link to="/admin/fast" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Ajuste de Algoritmo</h1>
            <p className="text-muted-foreground">
              Configure os parâmetros do algoritmo de Fast Pools para controlar odds, duração e comportamento
            </p>
          </div>

          <div className="grid gap-6">
            {/* Pool Duration */}
            <Card className="bg-card-secondary border-border-secondary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Duração do Pool
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pool-duration">Duração (segundos)</Label>
                  <Input
                    id="pool-duration"
                    type="number"
                    min="30"
                    max="300"
                    value={algorithmConfig.pool_duration_seconds}
                    onChange={(e) => setAlgorithmConfig({ 
                      ...algorithmConfig, 
                      pool_duration_seconds: parseInt(e.target.value) || 60 
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo total de cada pool em segundos (padrão: 60s)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lockout-time">Tempo de Bloqueio (segundos)</Label>
                  <Input
                    id="lockout-time"
                    type="number"
                    min="5"
                    max="30"
                    value={algorithmConfig.lockout_time_seconds}
                    onChange={(e) => setAlgorithmConfig({ 
                      ...algorithmConfig, 
                      lockout_time_seconds: parseInt(e.target.value) || 15 
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo antes do fim do pool onde apostas são bloqueadas (padrão: 15s)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Odds Configuration */}
            <Card className="bg-card-secondary border-border-secondary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Configuração de Odds
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Odds Inicial</Label>
                    <span className="text-lg font-bold text-primary">
                      {algorithmConfig.odds_start.toFixed(2)}x
                    </span>
                  </div>
                  <Slider
                    value={[algorithmConfig.odds_start]}
                    onValueChange={([value]) => setAlgorithmConfig({ 
                      ...algorithmConfig, 
                      odds_start: value 
                    })}
                    min={1.20}
                    max={3.00}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Odds no início do pool (padrão: 1.80x)
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Odds Final</Label>
                    <span className="text-lg font-bold text-primary">
                      {algorithmConfig.odds_end.toFixed(2)}x
                    </span>
                  </div>
                  <Slider
                    value={[algorithmConfig.odds_end]}
                    onValueChange={([value]) => setAlgorithmConfig({ 
                      ...algorithmConfig, 
                      odds_end: value 
                    })}
                    min={1.05}
                    max={1.50}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Odds no final do pool, antes do bloqueio (padrão: 1.10x)
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Intensidade da Curva</Label>
                    <span className="text-lg font-bold text-primary">
                      {algorithmConfig.odds_curve_intensity.toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    value={[algorithmConfig.odds_curve_intensity]}
                    onValueChange={([value]) => setAlgorithmConfig({ 
                      ...algorithmConfig, 
                      odds_curve_intensity: value 
                    })}
                    min={0.10}
                    max={1.00}
                    step={0.05}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Controla a velocidade de decaimento das odds (padrão: 0.60)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Limits */}
            <Card className="bg-card-secondary border-border-secondary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Limites de Odds
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="max-odds">Odds Máximo</Label>
                  <Input
                    id="max-odds"
                    type="number"
                    step="0.05"
                    min="2.00"
                    max="10.00"
                    value={algorithmConfig.max_odds}
                    onChange={(e) => setAlgorithmConfig({ 
                      ...algorithmConfig, 
                      max_odds: parseFloat(e.target.value) || 5.00 
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Odds máximo permitido no sistema (padrão: 5.00x)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min-odds">Odds Mínimo</Label>
                  <Input
                    id="min-odds"
                    type="number"
                    step="0.05"
                    min="1.01"
                    max="1.50"
                    value={algorithmConfig.min_odds}
                    onChange={(e) => setAlgorithmConfig({ 
                      ...algorithmConfig, 
                      min_odds: parseFloat(e.target.value) || 1.05 
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Odds mínimo permitido no sistema (padrão: 1.05x)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
              <Button
                variant="outline"
                onClick={loadAlgorithmConfig}
                disabled={saving}
              >
                Resetar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAlgorithm;
