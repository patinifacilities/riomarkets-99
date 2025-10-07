import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Ticket, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RaffleTicketCard } from '@/components/raffle/RaffleTicketCard';
import { RaffleTicketDetailModal } from '@/components/raffle/RaffleTicketDetailModal';

interface RaffleEntry {
  id: string;
  raffle_id: string;
  amount_paid: number;
  created_at: string;
  ticket_numbers: number[];
  raffles: {
    id: string;
    title: string;
    status: string;
    image_url?: string;
  };
}

const RaffleTickets = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState<RaffleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState<{ title: string; numbers: number[] } | null>(null);

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
            status,
            image_url,
            entry_cost
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching raffle entries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Consolidate entries by raffle - sum all tickets and collect ticket numbers
  const consolidatedEntries = useMemo(() => {
    const raffleMap = new Map<string, RaffleEntry>();
    
    entries.forEach(entry => {
      const raffleId = entry.raffle_id;
      if (raffleMap.has(raffleId)) {
        const existing = raffleMap.get(raffleId)!;
        existing.amount_paid += entry.amount_paid;
        existing.ticket_numbers = [...existing.ticket_numbers, ...entry.ticket_numbers];
      } else {
        raffleMap.set(raffleId, { ...entry });
      }
    });
    
    return Array.from(raffleMap.values()).sort((a, b) => b.amount_paid - a.amount_paid);
  }, [entries]);

  // Find the raffle entry with most tickets
  const topTicketEntry = useMemo(() => {
    if (consolidatedEntries.length === 0) return null;
    return consolidatedEntries[0];
  }, [consolidatedEntries]);

  useEffect(() => {
    fetchEntries();
  }, [user]);

  useEffect(() => {
    if (!user && !loading) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <Button
        variant="ghost"
        onClick={() => navigate('/raffles')}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Ticket className="w-8 h-8 text-primary" />
          Meus Bilhetes
        </h1>
        <p className="text-muted-foreground">
          Veja todos os seus bilhetes de rifas
        </p>
      </div>

      {consolidatedEntries.length === 0 ? (
        <Card className="p-12 text-center">
          <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Você ainda não possui bilhetes.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {consolidatedEntries.map((entry) => {
            const raffle = entry.raffles as any;
            const ticketCount = entry.amount_paid / 10; // Assuming entry_cost is 10 RZ
            const isTopTicket = topTicketEntry?.raffle_id === entry.raffle_id;

            return (
              <RaffleTicketCard
                key={entry.raffle_id}
                raffleTitle={raffle.title}
                ticketCount={ticketCount}
                purchaseDate={formatDistanceToNow(new Date(entry.created_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
                status={raffle.status}
                imageUrl={raffle.image_url}
                onClick={() => setSelectedTickets({ title: raffle.title, numbers: entry.ticket_numbers })}
                isTopTicket={isTopTicket}
              />
            );
          })}
        </div>
      )}

      {selectedTickets && (
        <RaffleTicketDetailModal
          isOpen={!!selectedTickets}
          onClose={() => setSelectedTickets(null)}
          raffleTitle={selectedTickets.title}
          ticketNumbers={selectedTickets.numbers}
        />
      )}
    </div>
  );
};

export default RaffleTickets;
