import { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle, DollarSign, Calculator } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Market } from '@/types';
import { useMarketPoolDetailed } from '@/hooks/useMarketPoolsDetailed';

interface LiquidationModalProps {
  market: Market | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const LiquidationModal = ({ market, isOpen, onClose, onSuccess }: LiquidationModalProps) => {
  const { toast } = useToast();
  const [selectedWinner, setSelectedWinner] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const poolData = useMarketPoolDetailed(market);

  // Calculate liquidation preview
  const liquidationPreview = useMemo(() => {
    if (!poolData || !selectedWinner) return null;

    const S_total = poolData.totalPool;
    const winnerOption = poolData.options.find(opt => opt.label === selectedWinner);
    const S_win = winnerOption?.pool || 0;
    const S_lose = S_total - S_win;
    const feePercent = 0.20; // Get from settings if needed
    const fee = S_lose * feePercent;
    const profit_pool = S_lose - fee;
    const multiplicador_efetivo = S_win > 0 ? (S_total - fee) / S_win : 0;

    return {
      S_total,
      S_win,
      S_lose,
      fee,
      profit_pool,
      multiplicador_efetivo,
      winnerBettors: winnerOption?.bettors || 0
    };
  }, [poolData, selectedWinner]);

  const handleLiquidate = async () => {
    if (!market || !selectedWinner) return;

    setIsLoading(true);

    try {
      // Call the improved liquidation edge function
      const { data, error } = await supabase.functions.invoke('liquidate-market-improved', {
        body: {
          marketId: market.id,
          winningOption: selectedWinner
        }
      });

      if (error) throw error;

      toast({
        title: "Mercado liquidado com sucesso!",
        description: `Opção vencedora: ${selectedWinner}. Prêmios distribuídos aos analistas.`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error liquidating market:', error);
      toast({
        title: "Erro na liquidação",
        description: "Falha ao liquidar mercado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!market || !poolData) return null;

  const hasZeroWinners = selectedWinner && liquidationPreview && liquidationPreview.S_win === 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Liquidar Mercado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-muted/50">
            <h3 className="font-semibold mb-2">{market.titulo}</h3>
            <p className="text-sm text-muted-foreground">{market.descricao}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-success" />
                <span className="font-medium">Pool Total</span>
              </div>
              <p className="text-2xl font-bold">{poolData?.totalPool || 0} Rioz Coin</p>
              <p className="text-sm text-muted-foreground">{poolData?.totalBettors || 0} analistas</p>
            </div>
            
            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4 text-primary" />
                <span className="font-medium">Tipo de Mercado</span>
              </div>
              <p className="text-lg font-semibold">
                {market.market_type === 'binary' && 'Binário (2 opções)'}
                {market.market_type === 'three_way' && 'Triplo (3 opções)'}
                {market.market_type === 'multi' && `Multi (${market.opcoes.length} opções)`}
                {!market.market_type && `${market.opcoes.length} opções`}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Selecione a opção vencedora:</h4>
            <div className={`grid gap-3 ${
              market.opcoes.length <= 2 ? 'grid-cols-2' : 
              market.opcoes.length === 3 ? 'grid-cols-3' : 
              'grid-cols-2 lg:grid-cols-3'
            }`}>
              {poolData?.options.map((option) => {
                const isSelected = selectedWinner === option.label;
                const percentage = option.chance.toFixed(1);
                
                return (
                  <button
                    key={option.label}
                    onClick={() => setSelectedWinner(option.label)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-lg">
                          {option.label === 'sim' ? 'SIM' :
                           option.label === 'não' || option.label === 'nao' ? 'NÃO' :
                           option.label.toUpperCase()}
                        </span>
                        <Badge variant="outline">
                          {percentage}%
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>{option.pool} Rioz Coin</p>
                        <p>{option.bettors} analistas</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zero winners warning */}
          {hasZeroWinners && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>ATENÇÃO:</strong> Ninguém apostou na opção vencedora "{selectedWinner}". 
                Não é possível liquidar este mercado automaticamente. Intervenção administrativa necessária.
              </AlertDescription>
            </Alert>
          )}

          {selectedWinner && liquidationPreview && !hasZeroWinners && (
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <h4 className="font-medium text-success mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Preview da Liquidação
              </h4>
              <div className="text-sm space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium">Pools:</p>
                    <p>• S_total: {liquidationPreview.S_total} Rioz Coin</p>
                    <p>• S_win ({selectedWinner}): {liquidationPreview.S_win} Rioz Coin</p>
                    <p>• S_lose: {liquidationPreview.S_lose} Rioz Coin</p>
                  </div>
                  <div>
                    <p className="font-medium">Cálculos:</p>
                    <p>• Taxa (20%): {Math.round(liquidationPreview.fee)} Rioz Coin</p>
                    <p>• Profit Pool: {Math.round(liquidationPreview.profit_pool)} Rioz Coin</p>
                    <p className="font-semibold text-success">• Multiplicador: {liquidationPreview.multiplicador_efetivo.toFixed(3)}x</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-success/20">
                  <p>• Analistas vencedores: {liquidationPreview.winnerBettors}</p>
                  <p>• Distribuição: Pari-passu (proporcional ao valor analisado)</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleLiquidate}
              disabled={!selectedWinner || isLoading || hasZeroWinners}
              className="shadow-success"
            >
              {isLoading ? 'Liquidando...' : 
               hasZeroWinners ? 'Liquidação Bloqueada' :
               'Confirmar Liquidação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LiquidationModal;