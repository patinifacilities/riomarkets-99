import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
} from '@/components/ui/alert-dialog';
import { Edit, Trash2, Shield, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UserEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: any;
  onSuccess?: () => void;
}

export const UserEditModal = ({ open, onOpenChange, user, onSuccess }: UserEditModalProps) => {
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(user?.is_admin || false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const logAdminAction = async (action: string, details: any) => {
    try {
      await supabase.from('audit_logs').insert({
        action,
        resource_type: 'user',
        resource_id: user.id,
        user_id: (await supabase.auth.getUser()).data.user?.id,
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

      // Update user balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          saldo_moeda: user.saldo_moeda + adjustAmount
        })
        .eq('id', user.id);

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

      setIsAdmin(!isAdmin);
      toast({
        title: 'Status de admin atualizado',
        description: `Usuário ${!isAdmin ? 'promovido a' : 'removido de'} administrador`,
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error updating admin status:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar status de administrador',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    setIsLoading(true);
    try {
      // Log admin action before deletion
      await logAdminAction('user_deletion', {
        user_email: user.email,
        user_name: user.nome,
        user_balance: user.saldo_moeda
      });

      // Delete user profile (this will cascade to related data due to FK constraints)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Usuário excluído',
        description: 'A conta do usuário foi excluída com sucesso',
      });

      onOpenChange(false);
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
      setShowDeleteConfirm(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Usuário - {user.nome}
            </DialogTitle>
            <DialogDescription>
              Gerencie as informações e permissões do usuário.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* User Info */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Informações do Usuário</h4>
              <p className="text-sm text-muted-foreground">Email: {user.email}</p>
              <p className="text-sm text-muted-foreground">Saldo atual: {user.saldo_moeda.toLocaleString()} RZ</p>
              <p className="text-sm text-muted-foreground">Nível: {user.nivel}</p>
            </div>

            {/* Balance Adjustment */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Ajustar Saldo
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  placeholder="+ para crédito, - para débito"
                />
                <Button
                  onClick={handleAdjustBalance}
                  disabled={adjustAmount === 0 || isLoading}
                  variant="outline"
                >
                  Aplicar
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setAdjustAmount(1000)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  +1,000
                </Button>
                <Button
                  onClick={() => setAdjustAmount(-1000)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  -1,000
                </Button>
              </div>
            </div>

            {/* Admin Status */}
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Status de Administrador
              </Label>
              <Switch
                checked={isAdmin}
                onCheckedChange={handleToggleAdmin}
                disabled={isLoading}
              />
            </div>

            {/* Delete User */}
            <div className="border-t pt-4">
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="destructive"
                className="w-full"
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Conta do Usuário
              </Button>
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

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a conta de {user.nome} e todos os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};