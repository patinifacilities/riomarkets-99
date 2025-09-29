import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Banknote, Search, Download, Eye, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Deposit {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  amount_brl: number;
  method: string;
  transaction_id?: string;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
  processed_at?: string;
  proof_url?: string;
}

const AdminDeposits = () => {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration - replace with actual Supabase query
      const mockDeposits: Deposit[] = [
        {
          id: '1',
          user_id: 'user-1',
          user_name: 'João Silva',
          user_email: 'joao@example.com',
          amount_brl: 100.00,
          method: 'PIX',
          transaction_id: 'PIX123456789',
          status: 'confirmed',
          created_at: new Date().toISOString(),
          processed_at: new Date().toISOString()
        },
        {
          id: '2',
          user_id: 'user-2',
          user_name: 'Maria Santos',
          user_email: 'maria@example.com',
          amount_brl: 250.00,
          method: 'PIX',
          transaction_id: 'PIX987654321',
          status: 'pending',
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '3',
          user_id: 'user-3',
          user_name: 'Carlos Oliveira',
          user_email: 'carlos@example.com',
          amount_brl: 500.00,
          method: 'TED',
          status: 'failed',
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
      ];
      
      setDeposits(mockDeposits);
    } catch (error) {
      console.error('Error fetching deposits:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar depósitos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, text: 'Pendente' },
      confirmed: { variant: 'default' as const, text: 'Confirmado' },
      failed: { variant: 'destructive' as const, text: 'Falhou' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const filteredDeposits = deposits.filter(deposit => {
    const matchesSearch = deposit.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deposit.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (deposit.transaction_id && deposit.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || deposit.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredDeposits.reduce((sum, deposit) => sum + deposit.amount_brl, 0);
  const todayDeposits = deposits.filter(d => {
    const today = new Date().toDateString();
    return new Date(d.created_at).toDateString() === today;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Depósitos</h1>
          <p className="text-muted-foreground">
            Monitore depósitos realizados na plataforma
          </p>
        </div>
        <Button className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Total Depositado</p>
                <p className="text-lg font-bold">
                  R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Hoje</p>
                <p className="text-lg font-bold">
                  R$ {todayDeposits.reduce((sum, d) => sum + d.amount_brl, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-lg font-bold">
                {deposits.filter(d => d.status === 'pending').length}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Confirmados</p>
              <p className="text-lg font-bold">
                {deposits.filter(d => d.status === 'confirmed').length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por usuário, email ou ID da transação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Deposits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Depósitos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>ID Transação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeposits.map((deposit) => (
                  <TableRow key={deposit.id}>
                    <TableCell className="font-medium">{deposit.user_name}</TableCell>
                    <TableCell>{deposit.user_email}</TableCell>
                    <TableCell>
                      R$ {deposit.amount_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{deposit.method}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {deposit.transaction_id || '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                    <TableCell>
                      {new Date(deposit.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {deposit.status === 'pending' && (
                          <>
                            <Button variant="default" size="sm">
                              Confirmar
                            </Button>
                            <Button variant="destructive" size="sm">
                              Rejeitar
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDeposits;