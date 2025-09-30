import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ExpandableRiozCardProps {
  currentBalance: number;
  totalInOrders: number;
  brlBalance: number;
}

export const ExpandableRiozCard = ({ currentBalance, totalInOrders, brlBalance }: ExpandableRiozCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-secondary-glass border-primary/20">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full p-0 h-auto">
            <CardContent className="p-6 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground text-left">Saldo RIOZ Coin</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-white">
                      {(currentBalance || 0).toLocaleString('pt-BR')} RZ
                    </p>
                    <TrendingUp className="w-5 h-5" style={{ color: '#00ff90' }} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="w-8 h-8 text-white" />
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardContent>
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-6 pb-6 space-y-4 border-t border-border/30 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-secondary-glass border-accent/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Em Ordens Ativas</p>
                      <p className="text-xl font-bold text-white">
                        {(totalInOrders || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RZ
                      </p>
                    </div>
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-secondary-glass border-success/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Saldo em R$/BRL</p>
                      <p className="text-xl font-bold text-white">
                        R$ {(brlBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};