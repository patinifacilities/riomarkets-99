import { useState } from 'react';
import { ArrowLeft, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

const AdminDeposits = () => {
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

  // Mock deposits data
  const deposits = [
    {
      id: '1',
      user: 'João Silva',
      amount: 250.00,
      method: 'PIX',
      status: 'completed',
      date: '2024-01-15T10:30:00Z'
    },
    {
      id: '2', 
      user: 'Maria Santos',
      amount: 500.00,
      method: 'Cartão de Crédito',
      status: 'pending',
      date: '2024-01-15T09:15:00Z'
    },
    {
      id: '3',
      user: 'Pedro Costa',
      amount: 1000.00,
      method: 'PIX',
      status: 'failed',
      date: '2024-01-14T16:45:00Z'
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
              <h1 className="text-3xl font-bold mb-2">Depósitos</h1>
              <p className="text-muted-foreground">
                Gerenciar e acompanhar depósitos dos usuários
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
                  <div className="p-2 rounded-lg bg-success/10">
                    <DollarSign className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Depositado</p>
                    <p className="text-2xl font-bold">R$ 15.250</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card-secondary border-border-secondary">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Concluídos</p>
                    <p className="text-2xl font-bold">89</p>
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
                    <p className="text-2xl font-bold">12</p>
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
                    <p className="text-2xl font-bold">3</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deposits Table */}
          <Card className="bg-card-secondary border-border-secondary">
            <CardHeader>
              <CardTitle>Depósitos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deposits.map((deposit) => (
                  <div
                    key={deposit.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(deposit.status)}
                      <div>
                        <h3 className="font-semibold">{deposit.user}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(deposit.date).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          R$ {deposit.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-muted-foreground">{deposit.method}</p>
                      </div>

                      <Badge className={getStatusColor(deposit.status)}>
                        {deposit.status === 'completed' && 'Concluído'}
                        {deposit.status === 'pending' && 'Pendente'}
                        {deposit.status === 'failed' && 'Falhou'}
                      </Badge>

                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
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

export default AdminDeposits;