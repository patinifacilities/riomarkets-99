import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, User } from 'lucide-react';
import { supportService, SupportTicket } from '@/services/support';
import { useToast } from '@/hooks/use-toast';

const statusLabels = {
  open: 'Aberto',
  in_progress: 'Em Andamento',
  resolved: 'Resolvido',
  closed: 'Fechado'
};

const statusColors = {
  open: 'destructive',
  in_progress: 'secondary',
  resolved: 'default',
  closed: 'outline'
} as const;

const priorityLabels = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente'
};

const categoryLabels = {
  general: 'Geral',
  technical: 'Técnico',
  financial: 'Financeiro',
  compliance: 'Compliance'
};

export const SupportTicketsTable = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: supportService.getAllTickets
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ ticketId, status, notes }: { ticketId: string; status: SupportTicket['status']; notes?: string }) => 
      supportService.updateTicketStatus(ticketId, status, notes),
    onSuccess: () => {
      toast({
        title: 'Status atualizado',
        description: 'O status do ticket foi atualizado com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      setSelectedTicket(null);
      setAdminNotes('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleStatusUpdate = (ticket: SupportTicket, newStatus: SupportTicket['status']) => {
    updateStatusMutation.mutate({
      ticketId: ticket.id,
      status: newStatus,
      notes: adminNotes || ticket.admin_notes
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tickets de Suporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            Tickets de Suporte
            <Badge variant="secondary" className="ml-2">
              {tickets.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Gerencie todos os tickets de suporte dos usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket: SupportTicket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-mono text-sm">
                    #{ticket.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-muted-foreground" />
                      {ticket.user_id.slice(0, 8)}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {ticket.subject}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {categoryLabels[ticket.category]}
                    </Badge>  
                  </TableCell>
                  <TableCell>
                    <Badge variant={ticket.priority === 'urgent' ? 'destructive' : 'secondary'}>
                      {priorityLabels[ticket.priority]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusColors[ticket.status]}>
                      {statusLabels[ticket.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(ticket.created_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setAdminNotes(ticket.admin_notes || '');
                      }}
                    >
                      Gerenciar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {tickets.length === 0 && (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum ticket encontrado</h3>
              <p className="text-muted-foreground">
                Não há tickets de suporte no momento.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Management Modal */}
      {selectedTicket && (
        <Card>
          <CardHeader>
            <CardTitle>
              Gerenciar Ticket #{selectedTicket.id.slice(0, 8)}
            </CardTitle>
            <CardDescription>
              {selectedTicket.subject}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Categoria</p>
                <p className="text-sm text-muted-foreground">
                  {categoryLabels[selectedTicket.category]}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Prioridade</p>
                <p className="text-sm text-muted-foreground">
                  {priorityLabels[selectedTicket.priority]}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Mensagem Original</p>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">{selectedTicket.message}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={selectedTicket.status}
                onValueChange={(value) => handleStatusUpdate(selectedTicket, value as SupportTicket['status'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Aberto</SelectItem>
                  <SelectItem value="in_progress">Em Andamento</SelectItem>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="closed">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notas Administrativas</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Adicione notas sobre o ticket..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTicket(null);
                  setAdminNotes('');
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleStatusUpdate(selectedTicket, selectedTicket.status)}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};