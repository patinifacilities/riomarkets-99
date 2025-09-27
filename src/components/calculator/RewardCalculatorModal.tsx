import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HelpCircle, Calculator, RotateCcw, X } from 'lucide-react';
import { useRewardCalculator } from '@/store/useRewardCalculator';
import { RewardInputs } from './RewardInputs';
import { RewardOutputs } from './RewardOutputs';
import { track } from '@/lib/analytics';

export function RewardCalculatorModal() {
  const { isOpen, closeCalculator, compute, reset } = useRewardCalculator();

  const handleClose = () => {
    closeCalculator();
  };

  const handleRecalculate = () => {
    compute();
  };

  const handleReset = () => {
    reset();
  };

  const handleFormulaClick = () => {
    track('view_calculator_formulas', {});
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="bg-background border border-primary/20 max-w-4xl max-h-[90vh] overflow-auto"
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking outside if there are validation errors
          // For now, allow closing
        }}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calculator className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-foreground">
                  Calculadora de recompensas
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Simule retorno e breakeven com base na sua estimativa
                </DialogDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={handleFormulaClick}
                  >
                    <HelpCircle className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Como calculamos</h4>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div>
                        <strong>Retorno bruto:</strong><br />
                        V × (p_user ÷ (1 - p_user))
                      </div>
                      <div>
                        <strong>Recompensa líquida:</strong><br />
                        retorno_bruto × (1 - taxa_total)
                      </div>
                      <div>
                        <strong>ROI:</strong><br />
                        (recompensa_líquida - V) ÷ V
                      </div>
                      <div>
                        <strong>Breakeven:</strong><br />
                        Probabilidade mínima para não ter prejuízo
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <strong>V</strong> = valor investido, <strong>p_user</strong> = sua probabilidade estimada
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-8 py-4">
          {/* Inputs (lado esquerdo) */}
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="font-medium text-foreground mb-2">Parâmetros</h3>
              <p className="text-sm text-muted-foreground">
                Configure sua análise e cenário
              </p>
            </div>
            <RewardInputs />
          </div>

          {/* Top divider em mobile */}
          <div className="md:hidden">
            <div className="border-t border-border my-6"></div>
          </div>

          {/* Outputs (lado direito) */}
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="font-medium text-foreground mb-2">Resultados</h3>
              <p className="text-sm text-muted-foreground">
                Retorno estimado e breakeven
              </p>
            </div>
            <RewardOutputs />
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t">
          <Button
            variant="ghost"
            onClick={handleReset}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-4 h-4" />
            Limpar
          </Button>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="border-primary/40 text-foreground hover:bg-primary/10"
            >
              Fechar
            </Button>
            <Button
              onClick={handleRecalculate}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-success"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Recalcular
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}