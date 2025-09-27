import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Market } from '@/types';

interface OddsControllerProps {
  market: Market;
  onOddsUpdate?: () => void;
}

export const OddsController = ({ market, onOddsUpdate }: OddsControllerProps) => {
  const [odds, setOdds] = useState<Record<string, number>>(market.recompensas || {});
  const [originalOdds, setOriginalOdds] = useState<Record<string, number>>(market.recompensas || {});
  const [hasChanges, setHasChanges] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const marketOdds = market.recompensas || {};
    setOdds(marketOdds);
    setOriginalOdds(marketOdds);
    setHasChanges(false);
  }, [market.recompensas]);

  // Check for changes whenever odds change
  useEffect(() => {
    const hasOddsChanged = Object.keys(odds).some(key => 
      Math.abs(odds[key] - (originalOdds[key] || 1)) > 0.01
    );
    setHasChanges(hasOddsChanged);
  }, [odds, originalOdds]);

  // For binary markets with exactly 2 options, we handle them specially
  const isBinaryMarket = market.opcoes.length === 2;
  const [option1, option2] = market.opcoes;

  const handleBinaryOddsChange = (value: number[]) => {
    const leftValue = Math.min(4, Math.max(1, value[0] / 100)); // Limit to 4x max
    const rightValue = Math.min(4, Math.max(1, (400 - value[0]) / 100)); // Inverse scale with 4x limit
    
    const newOdds = {
      [option1]: leftValue,
      [option2]: rightValue
    };
    setOdds(newOdds);
  };

  const confirmOddsUpdate = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('markets')
        .update({ 
          odds: odds,
          recompensas: odds // Update both odds and recompensas for backward compatibility
        })
        .eq('id', market.id);

      if (error) throw error;

      // Log admin action
      await supabase
        .from('audit_logs')
        .insert({
          action: 'odds_adjustment',
          resource_type: 'market',
          resource_id: market.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          new_values: odds,
          old_values: originalOdds
        });

      setOriginalOdds(odds);
      setHasChanges(false);
      onOddsUpdate?.();
      
      const oddsText = Object.entries(odds)
        .map(([key, value]) => `${key}: ${value.toFixed(2)}x`)
        .join(' | ');
      
      toast({
        title: "Odds atualizadas",
        description: oddsText,
      });
    } catch (error) {
      console.error('Error updating odds:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar odds",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOddsChange = (option: string, value: number[]) => {
    const newValue = Math.min(4, Math.max(1, value[0] / 100)); // Limit to 4x max
    const newOdds = {
      ...odds,
      [option]: newValue
    };
    setOdds(newOdds);
  };


  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Controle de Odds - {market.titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isBinaryMarket ? (
          // Special binary slider with two colors
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">{option1}</Label>
                <Badge variant="outline">
                  {(odds[option1] || 1).toFixed(2)}x
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">{option2}</Label>
                <Badge variant="outline" className="bg-[#ff2389]/10 border-[#ff2389] text-[#ff2389]">
                  {(odds[option2] || 1).toFixed(2)}x
                </Badge>
              </div>
            </div>
            
            <div className="relative">
              <Slider
                value={[(odds[option1] || 1) * 100]} // Convert to 100-400 scale (4x max)
                onValueChange={handleBinaryOddsChange}
                min={100}
                max={400}
                step={1}
                className="w-full [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-[#00ff90] [&_[role=slider]]:to-[#ff2389] [&_.slider-track]:bg-gradient-to-r [&_.slider-track]:from-[#00ff90]/20 [&_.slider-track]:to-[#ff2389]/20 [&_[data-orientation='horizontal']]:bg-gradient-to-r [&_[data-orientation='horizontal']]:from-[#00ff90] [&_[data-orientation='horizontal']]:to-[#ff2389]"
                disabled={isUpdating}
              />
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="text-primary">{option1}</span>
              <span className="text-[#ff2389]">{option2}</span>
            </div>
          </div>
        ) : (
          // Individual sliders for non-binary markets
          market.opcoes.map((option) => (
            <div key={option} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{option}</Label>
                <Badge variant="outline">
                  {(odds[option] || 1).toFixed(2)}x
                </Badge>
              </div>
              
              <Slider
                value={[(odds[option] || 1) * 100]} // Convert to 100-400 scale (4x max)
                onValueChange={(value) => handleOddsChange(option, value)}
                min={100}
                max={400}
                step={1}
                className="w-full [&_[data-orientation='horizontal']]:bg-gradient-to-r [&_[data-orientation='horizontal']]:from-[#00ff90] [&_[data-orientation='horizontal']]:to-[#ff2389]"
                disabled={isUpdating}
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1.00x</span>
                <span>4.00x</span>
              </div>
            </div>
          ))
        )}
        
        {/* Confirm Button - Only show when there are changes */}
        {hasChanges && (
          <div className="pt-4 border-t">
            <Button 
              onClick={confirmOddsUpdate}
              disabled={isUpdating}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isUpdating ? 'Aplicando...' : 'Confirmar Novos Odds'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};