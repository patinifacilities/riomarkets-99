import { useState } from 'react';
import { Users, Search, Plus, Minus, Lock, Unlock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useProfiles } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [adjustAmount, setAdjustAmount] = useState(0);
  const { data: users = [], isLoading, refetch } = useProfiles();
  const { toast } = useToast();

  const filteredUsers = users.filter(user =>
    user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdjustBalance = async (userId: string, amount: number) => {
    try {
      // Criar transação de ajuste
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          id: crypto.randomUUID(),
          user_id: userId,
          tipo: amount > 0 ? 'credito' : 'debito',
          valor: Math.abs(amount),
          descricao: `Ajuste administrativo: ${amount > 0 ? '+' : '-'}${Math.abs(amount)} Rioz Coin`
        });

      if (transactionError) throw transactionError;

      // Atualizar saldo do usuário
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          saldo_moeda: selectedUser.saldo_moeda + amount
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      toast({
        title: 'Saldo ajustado com sucesso',
        description: `${amount > 0 ? 'Creditado' : 'Debitado'} ${Math.abs(amount)} Rioz Coin`,
      });

      refetch();
      setSelectedUser(null);
      setAdjustAmount(0);
    } catch (error) {
      console.error('Erro ao ajustar saldo:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao ajustar saldo do usuário',
        variant: 'destructive',
      });
    }
  };

  const getLevelColor = (level: string) => {
    const colors = {
      'iniciante': 'bg-gray-500/20 text-gray-300',
      'analista': 'bg-accent-muted text-accent',
      'guru': 'bg-primary-glow/20 text-primary',
      'root': 'bg-danger-muted text-danger'
    };
    return colors[level as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Users className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Gerenciar Usuários</h1>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar usuários por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuários ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-foreground">
                          {user.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{user.nome}</h3>
                          {user.is_admin && (
                            <Badge variant="destructive" className="text-xs">Admin</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{user.email}</p>
                        <Badge className={getLevelColor(user.nivel)} variant="secondary">
                          {user.nivel}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {user.saldo_moeda.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">Rioz Coin</p>
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUser(user)}
                            >
                              Ajustar Saldo
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Ajustar Saldo - {user.nome}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Saldo Atual</label>
                                <p className="text-2xl font-bold text-primary">
                                  {user.saldo_moeda.toLocaleString()} Rioz Coin
                                </p>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">Valor do Ajuste</label>
                                <Input
                                  type="number"
                                  value={adjustAmount}
                                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                                  placeholder="Digite o valor (+ para crédito, - para débito)"
                                />
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  onClick={() => setAdjustAmount(1000)}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  +1,000
                                </Button>
                                <Button
                                  onClick={() => setAdjustAmount(-1000)}
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                >
                                  <Minus className="w-4 h-4 mr-1" />
                                  -1,000
                                </Button>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleAdjustBalance(user.id, adjustAmount)}
                                  disabled={adjustAmount === 0}
                                  className="flex-1"
                                >
                                  Confirmar Ajuste
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedUser(null);
                                    setAdjustAmount(0);
                                  }}
                                  className="flex-1"
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredUsers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminUsers;