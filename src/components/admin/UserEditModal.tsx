import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Edit, Trash2, Shield, DollarSign, Minus, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  nome: string;
  email: string;
  saldo_moeda: number;
  nivel: string;
  is_admin: boolean;
  created_at: string;
}

interface UserEditModalProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const UserEditModal = ({ user, open, onOpenChange, onSuccess }: UserEditModalProps) => {
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Guard clause - if user is null, don't render anything
  if (!user) {
    return null;
  }

  const isAdmin = user.is_admin;

  const logAdminAction = async (action: string, details: any) => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      await supabase
        .from('audit_logs')
        .insert({
          action,
          resource_type: 'user',
          resource_id: user.id,
          user_id: currentUser.user?.id,
          new_values: details,
          severity: 'info'
        });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  };

  const handleAdjustBalance = async () => {
    if (adjustAmount === 0) return;

    setIsLoading(true);
    try {
      // Create transaction record
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          id: crypto.randomUUID(),
          user_id: user.id,
          tipo: adjustAmount > 0 ? 'credito' : 'debito',
          valor: Math.abs(adjustAmount),
          descricao: `Ajuste administrativo: ${adjustAmount > 0 ? '+' : '-'}${Math.abs(adjustAmount)} Rioz Coin`
        });

      if (transactionError) throw transactionError;

      // Update user profile balance using the increment_balance function
      const { error: updateError } = await supabase.rpc('increment_balance', {
        user_id: user.id,
        amount: adjustAmount
      });

      if (updateError) throw updateError;

      // Log admin action
      await logAdminAction('balance_adjustment', {
        user_email: user.email,
        adjustment_amount: adjustAmount,
        previous_balance: user.saldo_moeda,
        new_balance: user.saldo_moeda + adjustAmount
      });

      toast({
        title: 'Saldo ajustado com sucesso',
        description: `${adjustAmount > 0 ? 'Creditado' : 'Debitado'} ${Math.abs(adjustAmount)} Rioz Coin`,
      });

      setAdjustAmount(0);
      onSuccess?.();
    } catch (error) {
      console.error('Error adjusting balance:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao ajustar saldo do usuário',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    setIsLoading(true);
    try {
      // First delete from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);
      
      if (profileError) throw profileError;

      // Log admin action
      await logAdminAction('user_deletion', {
        user_email: user.email,
        user_name: user.nome
      });

      toast({
        title: 'Usuário excluído com sucesso',
        description: `O usuário ${user.nome} foi removido do sistema`,
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir usuário',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAdmin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !isAdmin })
        .eq('id', user.id);

      if (error) throw error;

      // Log admin action
      await logAdminAction('admin_status_change', {
        user_email: user.email,
        previous_admin_status: isAdmin,
        new_admin_status: !isAdmin
      });

      toast({
        title: `Status de admin ${!isAdmin ? 'concedido' : 'removido'}`,
        description: `${user.nome} ${!isAdmin ? 'agora é' : 'não é mais'} administrador`,
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error toggling admin status:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao alterar status de administrador',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Editar Usuário
          </DialogTitle>
          <DialogDescription>
            Gerencie informações e permissões do usuário {user.nome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Nome</Label>
              <p className="text-sm">{user.nome}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <p className="text-sm">{user.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Saldo Atual</Label>
              <p className="text-sm font-mono">{user.saldo_moeda.toLocaleString()} Rioz Coin</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <div className="flex items-center gap-2">
                <Badge variant={isAdmin ? "destructive" : "secondary"}>
                  {isAdmin ? 'Administrador' : 'Usuário'}
                </Badge>
                <Badge variant="outline">{user.nivel}</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Balance Adjustment */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Ajustar Saldo</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setAdjustAmount(prev => prev - 100)}
                disabled={isLoading}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="text-center"
                disabled={isLoading}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setAdjustAmount(prev => prev + 100)}
                disabled={isLoading}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAdjustBalance}
                disabled={adjustAmount === 0 || isLoading}
                className="flex-1"
                size="sm"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Aplicar Ajuste
              </Button>
            </div>
          </div>

          <Separator />

          {/* Admin Actions */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Ações Administrativas</Label>
            
            <div className="flex gap-2">
              <Button
                onClick={handleToggleAdmin}
                disabled={isLoading}
                variant={isAdmin ? "destructive" : "default"}
                size="sm"
                className="flex-1"
              >
                <Shield className="w-4 h-4 mr-2" />
                {isAdmin ? 'Remover Admin' : 'Tornar Admin'}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir o usuário {user.nome}? 
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteUser}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir Usuário
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};