import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRewardCalculator } from '@/store/useRewardCalculator';
import { useState } from 'react';

export function RewardInputs() {
  const {
    value,
    pUser,
    pMkt,
    fee,
    cashout,
    cashoutFee,
    setValue,
    setPUser,
    setPMkt,
    setFee,
    setCashout,
    setCashoutFee,
  } = useRewardCalculator();

  const [showMarketProb, setShowMarketProb] = useState(false);

  // Convert probability to percentage for display
  const pUserPercent = Math.round(pUser * 100);
  const pMktPercent = pMkt ? Math.round(pMkt * 100) : '';

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    setValue(newValue);
  };

  const handlePUserSliderChange = (values: number[]) => {
    setPUser(values[0] / 100);
  };

  const handlePUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseInt(e.target.value) || 50;
    setPUser(Math.max(1, Math.min(99, percent)) / 100);
  };

  const handlePMktChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseInt(e.target.value) || null;
    setPMkt(percent ? Math.max(1, Math.min(99, percent)) / 100 : null);
  };

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseFloat(e.target.value) || 20;
    setFee(Math.max(0, Math.min(50, percent)) / 100);
  };

  const handleCashoutFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseFloat(e.target.value) || 2;
    setCashoutFee(Math.max(0, Math.min(20, percent)) / 100);
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Valor investido */}
        <div className="space-y-2">
          <Label htmlFor="value" className="text-sm font-medium flex items-center gap-2">
            Valor investido
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Quantidade de Rioz Coin que você pretende investir</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <div className="relative">
            <Input
              id="value"
              type="number"
              step="0.01"
              min="0"
              value={value}
              onChange={handleValueChange}
              className="pr-16 tabular-nums focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-describedby="value-hint"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
              Rioz
            </div>
          </div>
          <p id="value-hint" className="text-xs text-muted-foreground">
            Mínimo: 0.01 Rioz
          </p>
        </div>

        {/* Probabilidade do usuário */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            Sua estimativa de probabilidade
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Qual a probabilidade que você acredita que sua análise está correta?</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          
          <div className="space-y-3">
            <Slider
              value={[pUserPercent]}
              onValueChange={handlePUserSliderChange}
              max={99}
              min={1}
              step={1}
              className="w-full"
              aria-label="Probabilidade estimada"
            />
            
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="99"
                value={pUserPercent}
                onChange={handlePUserInputChange}
                className="w-20 tabular-nums focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </div>

        {/* Probabilidade de mercado (opcional) */}
        <Collapsible open={showMarketProb} onOpenChange={setShowMarketProb}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto font-normal"
            >
              <span className="text-sm text-muted-foreground">Probabilidade de mercado (opcional)</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showMarketProb ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="99"
                value={pMktPercent}
                onChange={handlePMktChange}
                placeholder="Ex: 45"
                className="w-20 tabular-nums focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Probabilidade implícita atual do mercado para comparação
            </p>
          </CollapsibleContent>
        </Collapsible>

        {/* Configurações avançadas */}
        <Accordion type="single" collapsible className="border rounded-lg">
          <AccordionItem value="settings" className="border-none">
            <AccordionTrigger className="px-4 py-3 text-sm hover:no-underline">
              Configurações de taxas
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              {/* Taxa da plataforma */}
              <div className="space-y-2">
                <Label htmlFor="fee" className="text-sm font-medium">
                  Taxa da plataforma
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="fee"
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={Math.round(fee * 100)}
                    onChange={handleFeeChange}
                    className="w-20 tabular-nums focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>

              {/* Cashout */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="cashout" className="text-sm font-medium">
                    Incluir taxa de cashout
                  </Label>
                  <Switch
                    id="cashout"
                    checked={cashout}
                    onCheckedChange={setCashout}
                  />
                </div>
                
                {cashout && (
                  <div className="space-y-2">
                    <Label htmlFor="cashout-fee" className="text-sm font-medium">
                      Taxa de cashout
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="cashout-fee"
                        type="number"
                        step="0.1"
                        min="0"
                        max="20"
                        value={Math.round(cashoutFee * 100 * 10) / 10}
                        onChange={handleCashoutFeeChange}
                        className="w-20 tabular-nums focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </TooltipProvider>
  );
}