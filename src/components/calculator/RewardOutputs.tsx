import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { useRewardCalculator } from '@/store/useRewardCalculator';

export function RewardOutputs() {
  const { results, pUser, pMkt, value } = useRewardCalculator();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatProbability = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  const getRoiColor = (roi: number) => {
    if (roi > 0) return 'text-success border-success/20 bg-success/5';
    if (roi < 0) return 'text-danger border-danger/20 bg-danger/5';
    return 'text-muted-foreground border-muted/20 bg-muted/5';
  };

  const getRoiIcon = (roi: number) => {
    if (roi > 0) return <TrendingUp className="w-4 h-4" />;
    if (roi < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getEducationalMessage = () => {
    const pUserPercent = Math.round(pUser * 100);
    const pBreakevenPercent = Math.round(results.pBreakeven * 100);
    
    if (pUser <= results.pBreakeven) {
      return {
        type: 'warning',
        message: `Com sua estimativa de ${pUserPercent}%, você precisa de ≥${pBreakevenPercent}% para não ter prejuízo após taxas.`,
      };
    } else {
      return {
        type: 'success',
        message: `Sua estimativa de ${pUserPercent}% está acima do ponto de equilíbrio (${pBreakevenPercent}%).`,
      };
    }
  };

  const educationalMsg = getEducationalMessage();

  return (
    <div className="space-y-6" aria-live="polite">
      {/* ROI Principal */}
      <div className="text-center space-y-2">
        <div className="text-sm text-muted-foreground">Retorno sobre investimento</div>
        <div className={`text-4xl font-bold tabular-nums flex items-center justify-center gap-2 ${getRoiColor(results.roi).split(' ')[0]}`}>
          {getRoiIcon(results.roi)}
          {formatPercent(results.roi)}
        </div>
      </div>

      <Separator />

      {/* Métricas principais */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-primary/10 bg-primary/5">
          <CardContent className="p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">Retorno bruto</div>
            <div className="text-lg font-semibold tabular-nums text-primary">
              {formatCurrency(results.retornoBruto)} Rioz
            </div>
          </CardContent>
        </Card>

        <Card className="border-accent/10 bg-accent/5">
          <CardContent className="p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">Recompensa líquida</div>
            <div className="text-lg font-semibold tabular-nums text-accent">
              {formatCurrency(results.recompensaLiquida)} Rioz
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ponto de equilíbrio */}
      <Card className="border-muted/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Probabilidade mínima (breakeven)</span>
            <Badge variant="outline" className="tabular-nums">
              {formatProbability(results.pBreakeven)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Desvio vs mercado (se disponível) */}
      {results.desvio !== undefined && pMkt && (
        <Card className="border-muted/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Desvio vs mercado</span>
              <Badge 
                variant="outline" 
                className={`tabular-nums ${
                  results.desvio > 0 
                    ? 'text-success border-success/30' 
                    : results.desvio < 0 
                    ? 'text-danger border-danger/30' 
                    : 'text-muted-foreground'
                }`}
              >
                {results.desvio > 0 ? '+' : ''}{formatPercent(results.desvio)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {results.desvio > 0 
                ? 'Sua estimativa está acima do mercado' 
                : results.desvio < 0 
                ? 'Sua estimativa está abaixo do mercado'
                : 'Sua estimativa alinha com o mercado'
              }
            </p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Mensagem educativa */}
      <Card className={`border-l-4 ${
        educationalMsg.type === 'success' 
          ? 'border-l-success bg-success/5' 
          : 'border-l-warning bg-warning/5'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 mt-0.5 shrink-0 ${
              educationalMsg.type === 'success' ? 'text-success' : 'text-warning'
            }`} />
            <div>
              <p className="text-sm font-medium">Resultado educativo</p>
              <p className="text-sm text-muted-foreground mt-1">
                {educationalMsg.message}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo em números */}
      <div className="space-y-2 text-xs text-muted-foreground">
        <div className="flex justify-between">
          <span>Investimento:</span>
          <span className="tabular-nums">{formatCurrency(value)} Rioz</span>
        </div>
        <div className="flex justify-between">
          <span>Sua probabilidade:</span>
          <span className="tabular-nums">{formatProbability(pUser)}</span>
        </div>
        {pMkt && (
          <div className="flex justify-between">
            <span>Prob. de mercado:</span>
            <span className="tabular-nums">{formatProbability(pMkt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}