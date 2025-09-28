import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CancelBetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  orderId?: string;
  orderAmount?: number;
}

export const CancelBetModal = ({ open, onOpenChange, onConfirm, orderId, orderAmount }: CancelBetModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      if (orderId) {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('User not authenticated');

        // Use the cancel_bet_with_fee function
        const { data, error } = await supabase.rpc('cancel_bet_with_fee', {
          p_order_id: orderId,
          p_user_id: user.user.id
        });

        if (error) throw error;

        if (!data || data.length === 0 || !data[0].success) {
          throw new Error(data?.[0]?.message || 'Cancellation failed');
        }

        // The order status is already updated by the cancel_bet_with_fee function

        // Dispatch balance update events
        window.dispatchEvent(new CustomEvent('balanceUpdated'));
        window.dispatchEvent(new CustomEvent('forceProfileRefresh'));

        toast({
          title: "Opinião cancelada",
          description: `Opinião cancelada. Reembolso: ${data[0].refund_amount} moedas (taxa de 30% aplicada).`,
          variant: "default",
        });
      } else {
        toast({
          title: "Opinião cancelada",
          description: "Sua opinião foi cancelada com sucesso.",
          variant: "default",
        });
      }
      
      onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Cancel error:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao cancelar opinião. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex flex-row items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-danger" />
          <DialogTitle>Cancelar Opinião</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-danger/10 border border-danger/20 rounded-lg p-4">
            <p className="text-sm text-danger font-medium mb-2">⚠️ Atenção!</p>
            <p className="text-sm text-muted-foreground">
              Cancelar sua opinião resultará em uma taxa de <strong className="text-danger">30%</strong> sobre o valor investido.
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Você tem certeza que deseja cancelar sua opinião? Esta ação não pode ser desfeita.
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Manter Opinião
          </Button>
          <Button
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 bg-danger hover:bg-danger/90 text-danger-foreground"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            {isLoading ? 'Cancelando...' : 'Cancelar Opinião'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};