import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { fiatService, FiatRequest } from '@/services/fiat';
import { FiatRequestModal } from '@/components/fiat/FiatRequestModal';

const statusLabels = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  processed: 'Processado'
};

const statusColors = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
  processed: 'outline'
} as const;

const FiatRequests = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['fiat-requests'],
    queryFn: fiatService.getUserFiatRequests
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-24 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Solicitações PIX</h1>
          <p className="text-muted-foreground">Gerencie seus depósitos e saques</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Solicitação
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma solicitação encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Você ainda não fez nenhuma solicitação de PIX.
            </p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Fazer Primeira Solicitação
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request: FiatRequest) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    {request.request_type === 'deposit' ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        {request.request_type === 'deposit' ? 'Depósito' : 'Saque'} PIX
                      </CardTitle>
                      <CardDescription>
                        Solicitação #{request.id.slice(0, 8)} • 
                        Criada {formatDistanceToNow(new Date(request.created_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={statusColors[request.status]}>
                    {statusLabels[request.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium">Valor</p>
                    <p className="text-2xl font-bold">
                      R$ {request.amount_brl.toLocaleString('pt-BR', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                  </div>
                  {request.pix_key && (
                    <div>
                      <p className="text-sm font-medium">Chave PIX</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {request.pix_key}
                      </p>
                    </div>
                  )}
                </div>

                {request.admin_notes && (
                  <div className="bg-muted p-3 rounded-lg mb-4">
                    <p className="text-sm font-medium mb-1">Nota da equipe:</p>
                    <p className="text-sm text-muted-foreground">{request.admin_notes}</p>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>
                    Atualizada {formatDistanceToNow(new Date(request.updated_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                  {request.processed_at && (
                    <span>
                      Processada {formatDistanceToNow(new Date(request.processed_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FiatRequestModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
      />
    </div>
  );
};

export default FiatRequests;