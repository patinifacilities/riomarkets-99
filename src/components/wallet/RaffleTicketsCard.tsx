import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RaffleEntry {
  id: string;
  raffle_id: string;
  amount_paid: number;
  created_at: string;
  raffles: {
    id: string;
    title: string;
    entry_cost: number;
  };
}

export const RaffleTicketsCard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [entries, setEntries] = useState<RaffleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('raffle_entries')
        .select(`
          *,
          raffles (
            id,
            title,
            entry_cost
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching raffle entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();

    const channel = supabase
      .channel('raffle_entries_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'raffle_entries',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchEntries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const displayedEntries = expanded ? entries : entries.slice(0, 3);

  return (
    <Card className="bg-secondary-glass border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Bilhetes de Rifas
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/raffle-tickets')}
          >
            Ver todos
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/20 rounded animate-pulse" />
            ))}
          </div>
        ) : entries.length > 0 ? (
          <>
            <div className="space-y-3">
              {displayedEntries.map((entry) => {
                const raffle = entry.raffles as any;
                const ticketCount = entry.amount_paid / raffle.entry_cost;

                return (
                  <div
                    key={entry.id}
                    className="p-3 rounded-lg border border-border/50 hover:border-border/70 transition-all cursor-pointer"
                    onClick={() => navigate(`/raffles/${raffle.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {raffle.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {ticketCount} bilhete(s) • {formatDistanceToNow(new Date(entry.created_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                      <div className="text-right ml-3">
                        <div className="text-sm font-bold text-primary">
                          {entry.amount_paid} RZ
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {entries.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="w-full mt-3"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Ver menos
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Ver mais ({entries.length - 3})
                  </>
                )}
              </Button>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum bilhete ainda</p>
            <p className="text-sm mt-1 mb-4">Compre bilhetes de rifas</p>
            <Button onClick={() => navigate('/raffles')}>
              <Ticket className="w-4 h-4 mr-2" />
              Ver Rifas
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
