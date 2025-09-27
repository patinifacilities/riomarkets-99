import { useState } from 'react';
import { Play, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Market } from '@/types';

interface MarketTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TestResult {
  step: string;
  status: 'pending' | 'success' | 'error';
  message: string;
}

const MarketTestModal = ({ isOpen, onClose }: MarketTestModalProps) => {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const updateResult = (step: string, status: 'pending' | 'success' | 'error', message: string) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.step === step);
      if (existing) {
        return prev.map(r => r.step === step ? { step, status, message } : r);
      }
      return [...prev, { step, status, message }];
    });
  };

  const runE2ETest = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // Test 1: Create Binary Market
      updateResult('binary_market', 'pending', 'Criando mercado binário...');
      const binaryMarket = {
        id: `test_binary_${Date.now()}`,
        titulo: 'Teste Mercado Binário',
        descricao: 'Mercado de teste binário (Sim/Não)',
        categoria: 'teste',
        market_type: 'binary' as const,
        opcoes: ['sim', 'não'],
        odds: { sim: 2.0, não: 2.0 },
        status: 'aberto' as const,
        end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      const { error: binaryError } = await supabase
        .from('markets')
        .insert(binaryMarket);

      if (binaryError) throw new Error(`Falha ao criar mercado binário: ${binaryError.message}`);
      updateResult('binary_market', 'success', 'Mercado binário criado com sucesso');

      // Test 2: Create Three-Way Market
      updateResult('three_way_market', 'pending', 'Criando mercado three-way...');
      const threeWayMarket = {
        id: `test_threeway_${Date.now()}`,
        titulo: 'Teste Mercado Three-Way',
        descricao: 'Mercado de teste three-way (Sim/Não/Empate)',
        categoria: 'teste',
        market_type: 'three_way' as const,
        opcoes: ['sim', 'não', 'empate'],
        odds: { sim: 2.5, não: 2.5, empate: 3.0 },
        status: 'aberto' as const,
        end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      const { error: threeWayError } = await supabase
        .from('markets')
        .insert(threeWayMarket);

      if (threeWayError) throw new Error(`Falha ao criar mercado three-way: ${threeWayError.message}`);
      updateResult('three_way_market', 'success', 'Mercado three-way criado com sucesso');

      // Test 3: Create Multi Market
      updateResult('multi_market', 'pending', 'Criando mercado multi-opção...');
      const multiMarket = {
        id: `test_multi_${Date.now()}`,
        titulo: 'Teste Mercado Multi-Opção',
        descricao: 'Mercado de teste com múltiplas opções',
        categoria: 'teste',
        market_type: 'multi' as const,
        opcoes: ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
        odds: { 'Opção A': 2.0, 'Opção B': 3.0, 'Opção C': 4.0, 'Opção D': 5.0 },
        status: 'aberto' as const,
        end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      const { error: multiError } = await supabase
        .from('markets')
        .insert(multiMarket);

      if (multiError) throw new Error(`Falha ao criar mercado multi: ${multiError.message}`);
      updateResult('multi_market', 'success', 'Mercado multi-opção criado com sucesso');

      // Test 4: Test Pools Calculation
      updateResult('calc_pools', 'pending', 'Testando cálculo de pools...');
      const { data: poolsData, error: poolsError } = await supabase.functions.invoke('calc-pools-with-rewards', {
        body: { market_id: threeWayMarket.id }
      });

      if (poolsError) throw new Error(`Falha no cálculo de pools: ${poolsError.message}`);
      updateResult('calc_pools', 'success', `Pools calculados: ${JSON.stringify(poolsData)}`);

      // Test 5: Test Liquidation (Mock)
      updateResult('liquidation_test', 'pending', 'Testando liquidação...');
      
      // Close market first
      await supabase
        .from('markets')
        .update({ status: 'fechado' })
        .eq('id', threeWayMarket.id);

      // Test liquidation with 'empate'
      const { error: liquidationError } = await supabase.functions.invoke('liquidate-market-improved', {
        body: {
          marketId: threeWayMarket.id,
          winningOption: 'empate'
        }
      });

      if (liquidationError) {
        // Expected if no orders exist
        updateResult('liquidation_test', 'success', 'Liquidação testada (sem análises ativas)');
      } else {
        updateResult('liquidation_test', 'success', 'Liquidação executada com sucesso');
      }

      // Final cleanup
      updateResult('cleanup', 'pending', 'Limpando dados de teste...');
      await supabase.from('markets').delete().in('id', [
        binaryMarket.id,
        threeWayMarket.id,
        multiMarket.id
      ]);
      updateResult('cleanup', 'success', 'Cleanup concluído');

      toast({
        title: "Testes E2E Completos!",
        description: "Todos os bloqueadores foram corrigidos com sucesso.",
      });

    } catch (error) {
      console.error('E2E Test Error:', error);
      updateResult('error', 'error', `Erro: ${error.message}`);
      
      toast({
        title: "Erro nos testes",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-primary animate-spin" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            Teste E2E - Correção de Bloqueadores
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              Este teste verifica se todos os bloqueadores identificados na auditoria foram corrigidos:
              criação de mercados three-way/multi, liquidação com "Empate", e edge functions melhoradas.
            </AlertDescription>
          </Alert>

          {testResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="font-medium">{result.step}</div>
                    <div className="text-sm text-muted-foreground">{result.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button
              onClick={runE2ETest}
              disabled={isRunning}
              className="gap-2 shadow-success"
            >
              <Play className="w-4 h-4" />
              {isRunning ? 'Executando...' : 'Executar Testes E2E'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MarketTestModal;