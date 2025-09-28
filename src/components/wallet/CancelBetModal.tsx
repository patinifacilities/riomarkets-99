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
      if (orderId && orderAmount) {
        // Calculate 30% fee
        const cancelFee = orderAmount * 0.30;
        const refundAmount = orderAmount - cancelFee;

        // Update order status to cancelled
        const { error: orderError } = await supabase
          .from('orders')
          .update({ 
            status: 'cancelada',
            cashed_out_at: new Date().toISOString(),
            cashout_amount: refundAmount
          })
          .eq('id', orderId);

        if (orderError) throw orderError;

        // Create refund transaction
        const { error: transactionError } = await supabase
          .from('wallet_transactions')
          .insert({
            id: `cancel_${orderId}_${Date.now()}`,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            tipo: 'credito',
            valor: refundAmount,
            descricao: `Reembolso de cancelamento - Taxa de 30% aplicada`,
            market_id: null
          });

        if (transactionError) throw transactionError;

        // Update user balance
        const { error: balanceError } = await supabase.rpc('increment_balance', {
          user_id: (await supabase.auth.getUser()).data.user?.id,
          amount: Math.floor(refundAmount)
        });

        if (balanceError) throw balanceError;
      }

      await onConfirm();
      toast({
        title: "Opinião cancelada",
        description: "Sua opinião foi cancelada com sucesso. Taxa de 30% aplicada.",
        variant: "default",
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Cancel error:', error);
      toast({
        title: "Erro",
        description: "Falha ao cancelar opinião. Tente novamente.",
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