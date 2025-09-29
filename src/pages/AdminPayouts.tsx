import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Search, Filter, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Payout {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  amount_brl: number;
  method: string;
  pix_key?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  created_at: string;
  processed_at?: string;
  admin_notes?: string;
}

const AdminPayouts = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration - replace with actual Supabase query
      const mockPayouts: Payout[] = [
        {
          id: '1',
          user_id: 'user-1',
          user_name: 'João Silva',
          user_email: 'joao@example.com',
          amount_brl: 500.00,
          method: 'PIX',
          pix_key: 'joao@example.com',
          status: 'pending',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          user_id: 'user-2',
          user_name: 'Maria Santos',
          user_email: 'maria@example.com',
          amount_brl: 1200.00,
          method: 'PIX',
          pix_key: '+55 11 99999-9999',
          status: 'approved',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          processed_at: new Date().toISOString()
        }
      ];
      
      setPayouts(mockPayouts);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar saques",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, text: 'Pendente' },
      approved: { variant: 'default' as const, text: 'Aprovado' },
      rejected: { variant: 'destructive' as const, text: 'Rejeitado' },
      processed: { variant: 'default' as const, text: 'Processado' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch = payout.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payout.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredPayouts.reduce((sum, payout) => sum + payout.amount_brl, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payouts</h1>
          <p className="text-muted-foreground">
            Gerencie solicitações de saque da plataforma
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
              <CreditCard className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Solicitado</p>
                <p className="text-lg font-bold">
                  R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                {payouts.filter(p => p.status === 'pending').length}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Aprovados</p>
              <p className="text-lg font-bold">
                {payouts.filter(p => p.status === 'approved').length}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Processados</p>
              <p className="text-lg font-bold">
                {payouts.filter(p => p.status === 'processed').length}
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
                  placeholder="Buscar por usuário ou email..."
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
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
                <SelectItem value="processed">Processado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitações de Saque</CardTitle>
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
                  <TableHead>Chave PIX</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-medium">{payout.user_name}</TableCell>
                    <TableCell>{payout.user_email}</TableCell>
                    <TableCell>
                      R$ {payout.amount_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{payout.method}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {payout.pix_key || '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(payout.status)}</TableCell>
                    <TableCell>
                      {new Date(payout.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {payout.status === 'pending' && (
                          <>
                            <Button variant="default" size="sm">
                              Aprovar
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

export default AdminPayouts;