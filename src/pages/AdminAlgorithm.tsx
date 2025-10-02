import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Save, TrendingUp, Clock, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
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
    lockout_time_seconds: 2,
    max_odds: 5.00,
    min_odds: 1.05,
    algorithm_type: 'dynamic',
    algo2_odds_high: 1.90,
    algo2_odds_low: 1.10
  });

  const [initialConfig, setInitialConfig] = useState(algorithmConfig);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadAlgorithmConfig();
  }, []);

  // Check if config has changed
  useEffect(() => {
    const changed = JSON.stringify(algorithmConfig) !== JSON.stringify(initialConfig);
    setHasChanges(changed);
  }, [algorithmConfig, initialConfig]);

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
        const config = {
          pool_duration_seconds: data.pool_duration_seconds,
          odds_start: Number(data.odds_start),
          odds_end: Number(data.odds_end),
          odds_curve_intensity: Number(data.odds_curve_intensity),
          lockout_time_seconds: data.lockout_time_seconds,
          max_odds: Number(data.max_odds),
          min_odds: Number(data.min_odds),
          algorithm_type: data.algorithm_type || 'dynamic',
          algo2_odds_high: Number(data.algo2_odds_high || 1.90),
          algo2_odds_low: Number(data.algo2_odds_low || 1.10)
        };
        setAlgorithmConfig(config);
        setInitialConfig(config);
        setHasChanges(false);
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
            {/* Algorithm Type Switch */}
            <Card className="relative overflow-hidden border-[#ff2389]" style={{ backgroundColor: '#ff2389' }}>
              <div className="absolute inset-0 opacity-50">
                {/* Animated gradient orbs */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20 animate-pulse" style={{ animationDuration: '3s' }} />
                <div className="absolute top-0 left-1/4 w-32 h-32 bg-white/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '2s' }} />
                <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-white/25 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
                {/* Moving particles effect */}
                <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-white/60 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-white/60 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.7s' }} />
                <div className="absolute top-2/3 left-2/3 w-2 h-2 bg-white/60 rounded-full animate-ping" style={{ animationDuration: '3.5s', animationDelay: '1.2s' }} />
              </div>
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2 text-white drop-shadow-lg">
                  <Zap className="w-5 h-5 animate-pulse" style={{ animationDuration: '2s' }} />
                  Tipo de Algoritmo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 relative">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="algorithm-type" className="text-base font-semibold text-white drop-shadow">
                      {algorithmConfig.algorithm_type === 'price_based' ? 'Algoritmo 2 (Baseado em Preço)' : 'Algoritmo 1 (Dinâmico)'}
                    </Label>
                    <p className="text-sm text-white/90 drop-shadow">
                      {algorithmConfig.algorithm_type === 'price_based' 
                        ? 'Odds ajustados baseados na diferença entre opening_price e current_price'
                        : 'Odds decrescem conforme o tempo do pool passa'}
                    </p>
                  </div>
                   <Switch
                    id="algorithm-type"
                    checked={algorithmConfig.algorithm_type === 'price_based'}
                    onCheckedChange={async (checked) => {
                      const newConfig = {
                        ...algorithmConfig,
                        algorithm_type: checked ? 'price_based' : 'dynamic'
                      };
                      setAlgorithmConfig(newConfig);
                      
                      // Auto-save immediately when algorithm type changes
                      try {
                        const { data: existing } = await supabase
                          .from('fast_pool_algorithm_config')
                          .select('id')
                          .order('updated_at', { ascending: false })
                          .limit(1)
                          .single();

                        if (existing) {
                          await supabase
                            .from('fast_pool_algorithm_config')
                            .update(newConfig)
                            .eq('id', existing.id);
                        } else {
                          await supabase
                            .from('fast_pool_algorithm_config')
                            .insert([newConfig]);
                        }

                        toast({
                          title: "Algoritmo atualizado",
                          description: "As configurações foram aplicadas imediatamente aos pools ativos",
                          duration: 2000,
                        });
                        
                        // Update initial config to reflect saved state
                        setInitialConfig(newConfig);
                        setHasChanges(false);
                      } catch (error) {
                        console.error('Error auto-saving algorithm:', error);
                        toast({
                          title: "Erro ao salvar",
                          description: "Não foi possível salvar as configurações",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="data-[state=checked]:bg-white data-[state=unchecked]:bg-gray-900 border-2 border-white"
                  />
                </div>
              </CardContent>
            </Card>

            {algorithmConfig.algorithm_type === 'dynamic' ? (
              <>
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
                    onChange={(e) => {
                      const value = e.target.value;
                      setAlgorithmConfig({ 
                        ...algorithmConfig, 
                        pool_duration_seconds: value === '' ? 60 : parseInt(value) 
                      });
                    }}
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
                    onChange={(e) => {
                      const value = e.target.value;
                      setAlgorithmConfig({ 
                        ...algorithmConfig, 
                        lockout_time_seconds: value === '' ? 15 : parseInt(value) 
                      });
                    }}
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
            {hasChanges && (
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
            )}
            </>
            ) : (
              <>
                {/* Pool Duration - Also for Algorithm 2 */}
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
                    onChange={(e) => {
                      const value = e.target.value;
                      setAlgorithmConfig({ 
                        ...algorithmConfig, 
                        pool_duration_seconds: value === '' ? 60 : parseInt(value) 
                      });
                    }}
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
                    onChange={(e) => {
                      const value = e.target.value;
                      setAlgorithmConfig({ 
                        ...algorithmConfig, 
                        lockout_time_seconds: value === '' ? 15 : parseInt(value) 
                      });
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo antes do fim do pool onde apostas são bloqueadas (padrão: 15s)
                  </p>
                </div>
              </CardContent>
            </Card>

                {/* Algorithm 2 - Price Based */}
                <Card className="bg-card-secondary border-border-secondary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Configuração de Odds - Algoritmo 2
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 bg-muted/20 rounded-lg space-y-2">
                      <p className="text-sm font-medium">Lógica do Algoritmo 2:</p>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Se opening_price {'<'} current_price: Subir = {algorithmConfig.algo2_odds_low}x, Descer = {algorithmConfig.algo2_odds_high}x</li>
                        <li>Se opening_price {'>'} current_price: Subir = {algorithmConfig.algo2_odds_high}x, Descer = {algorithmConfig.algo2_odds_low}x</li>
                        <li>Os odds se ajustam conforme o current_price se aproxima do opening_price</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <Label>Odds Alto</Label>
                        <span className="text-lg font-bold text-primary">
                          {algorithmConfig.algo2_odds_high.toFixed(2)}x
                        </span>
                      </div>
                      <Slider
                        value={[algorithmConfig.algo2_odds_high]}
                        onValueChange={([value]) => setAlgorithmConfig({ 
                          ...algorithmConfig, 
                          algo2_odds_high: value 
                        })}
                        min={1.50}
                        max={3.00}
                        step={0.05}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Odds atribuído ao lado desfavorecido (padrão: 1.90x)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <Label>Odds Baixo</Label>
                        <span className="text-lg font-bold text-primary">
                          {algorithmConfig.algo2_odds_low.toFixed(2)}x
                        </span>
                      </div>
                      <Slider
                        value={[algorithmConfig.algo2_odds_low]}
                        onValueChange={([value]) => setAlgorithmConfig({ 
                          ...algorithmConfig, 
                          algo2_odds_low: value 
                        })}
                        min={1.05}
                        max={1.50}
                        step={0.05}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Odds atribuído ao lado favorecido (padrão: 1.10x)
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Save Button */}
                {hasChanges && (
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
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAlgorithm;
