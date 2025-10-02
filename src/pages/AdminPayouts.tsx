import { useState } from 'react';
import { ArrowLeft, ArrowUpRight, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

const AdminPayouts = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Security check
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  // Mock payouts data
  const payouts = [
    {
      id: '1',
      user: 'Ana Costa',
      amount: 750.00,
      method: 'PIX',
      status: 'completed',
      date: '2024-01-15T14:20:00Z',
      pixKey: 'ana@email.com'
    },
    {
      id: '2',
      user: 'Carlos Lima',
      amount: 1200.00,
      method: 'Transferência',
      status: 'pending',
      date: '2024-01-15T11:30:00Z',
      bankAccount: '***-1234'
    },
    {
      id: '3',
      user: 'Fernanda Souza',
      amount: 450.00,
      method: 'PIX',
      status: 'failed',
      date: '2024-01-14T18:15:00Z',
      pixKey: 'fernanda@email.com'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'failed':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 lg:ml-0 overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-4 py-8 overflow-x-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Link>
              <h1 className="text-3xl font-bold mb-2">Saques (Payouts)</h1>
              <p className="text-muted-foreground">
                Gerenciar e processar saques dos usuários
              </p>
            </div>
            <Badge variant="destructive" className="text-xs">
              ADMIN
            </Badge>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card-secondary border-border-secondary">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <ArrowUpRight className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sacado</p>
                    <p className="text-2xl font-bold">R$ 8.920</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card-secondary border-border-secondary">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Processados</p>
                    <p className="text-2xl font-bold">67</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card-secondary border-border-secondary">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Clock className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                    <p className="text-2xl font-bold">8</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card-secondary border-border-secondary">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <XCircle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Falharam</p>
                    <p className="text-2xl font-bold">2</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payouts Table */}
          <Card className="bg-card-secondary border-border-secondary">
            <CardHeader>
              <CardTitle>Saques Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(payout.status)}
                      <div>
                        <h3 className="font-semibold">{payout.user}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(payout.date).toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payout.pixKey || payout.bankAccount}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          R$ {payout.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-muted-foreground">{payout.method}</p>
                      </div>

                      <Badge className={getStatusColor(payout.status)}>
                        {payout.status === 'completed' && 'Processado'}
                        {payout.status === 'pending' && 'Pendente'}
                        {payout.status === 'failed' && 'Falhou'}
                      </Badge>

                      <div className="flex gap-2">
                        {payout.status === 'pending' && (
                          <Button size="sm" className="bg-success hover:bg-success/90">
                            Aprovar
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminPayouts;