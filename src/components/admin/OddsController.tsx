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
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setOdds(market.recompensas || {});
  }, [market.recompensas]);

  const handleOddsChange = (option: string, value: number[]) => {
    const newOdds = {
      ...odds,
      [option]: value[0] / 100 // Convert from 100-1000 scale to 1.00-10.00
    };
    setOdds(newOdds);
  };

  const updateOddsInDatabase = async (option: string, newValue: number) => {
    setIsUpdating(true);
    try {
      const updatedOdds = {
        ...odds,
        [option]: newValue
      };

      const { error } = await supabase
        .from('markets')
        .update({ recompensas: updatedOdds, odds: updatedOdds })
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
          new_values: { [option]: newValue },
          old_values: { [option]: odds[option] }
        });

      onOddsUpdate?.();
      
      toast({
        title: "Odds atualizadas",
        description: `${option}: ${newValue.toFixed(2)}x`,
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

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Controle de Odds - {market.titulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {market.opcoes.map((option) => (
          <div key={option} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{option}</Label>
              <Badge variant="outline">
                {(odds[option] || 1).toFixed(2)}x
              </Badge>
            </div>
            
            <Slider
              value={[(odds[option] || 1) * 100]} // Convert to 100-1000 scale
              onValueChange={(value) => handleOddsChange(option, value)}
              onValueCommit={(value) => updateOddsInDatabase(option, value[0] / 100)}
              min={100}
              max={1000}
              step={1}
              className="w-full"
              disabled={isUpdating}
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1.00x</span>
              <span>10.00x</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};