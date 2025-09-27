import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, Plus } from 'lucide-react';
import { supportService, SupportTicket } from '@/services/support';
import { CreateTicketModal } from './CreateTicketModal';
import { useState } from 'react';

const statusLabels = {
  open: 'Aberto',
  in_progress: 'Em Andamento',
  resolved: 'Resolvido',
  closed: 'Fechado'
};

const statusColors = {
  open: 'default',
  in_progress: 'secondary',
  resolved: 'outline',
  closed: 'outline'
} as const;

const priorityLabels = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente'
};

const priorityColors = {
  low: 'outline',
  normal: 'default',
  high: 'secondary',
  urgent: 'destructive'
} as const;

const categoryLabels = {
  general: 'Geral',
  technical: 'Técnico',
  financial: 'Financeiro',
  compliance: 'Compliance'
};

export const TicketsList = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: supportService.getUserTickets
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Meus Tickets</h1>
          <p className="text-muted-foreground">Acompanhe suas solicitações de suporte</p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Ticket
        </Button>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum ticket encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Você ainda não criou nenhum ticket de suporte.
            </p>
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket: SupportTicket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{ticket.subject}</CardTitle>
                    <CardDescription>
                      Ticket #{ticket.id.slice(0, 8)} • {categoryLabels[ticket.category]} • 
                      Criado {formatDistanceToNow(new Date(ticket.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant={priorityColors[ticket.priority]}>
                      {priorityLabels[ticket.priority]}
                    </Badge>
                    <Badge variant={statusColors[ticket.status]}>
                      {statusLabels[ticket.status]}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {ticket.message}
                </p>
                {ticket.admin_notes && (
                  <div className="bg-muted p-3 rounded-lg mb-4">
                    <p className="text-sm font-medium mb-1">Nota da equipe:</p>
                    <p className="text-sm text-muted-foreground">{ticket.admin_notes}</p>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Atualizado {formatDistanceToNow(new Date(ticket.updated_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Ver Conversa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateTicketModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen} 
      />
    </>
  );
};