import { useState } from 'react';
import { Wallet, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AddBrlModal } from '@/components/exchange/AddBrlModal';
import { useProfile } from '@/hooks/useProfile';

interface WalletHoverCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletHoverCard = ({ isOpen, onClose }: WalletHoverCardProps) => {
  const { data: profile } = useProfile();
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  
  if (!isOpen) return null;

  return (
    <>
      <div className="absolute top-full right-0 mt-2 z-50">
        <Card className="w-64 bg-background border shadow-lg">
          <CardContent className="p-4 space-y-3">
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">Saldo Disponível</div>
              <div className="text-2xl font-bold text-primary">
                {(profile?.saldo_moeda || 0).toLocaleString()} RZ
              </div>
              <div className="text-sm text-muted-foreground">
                R$ {((profile?.saldo_moeda || 0) * 0.1).toFixed(2)}
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className="w-full"
                style={{ backgroundColor: '#00ff90', color: 'white' }}
                onClick={() => {
                  setDepositModalOpen(true);
                  onClose();
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Depositar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <AddBrlModal 
        open={depositModalOpen}
        onOpenChange={setDepositModalOpen}
      />
    </>
  );
};