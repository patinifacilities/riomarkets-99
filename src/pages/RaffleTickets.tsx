import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Ticket, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
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
    status: string;
    image_url?: string;
  };
}

const RaffleTickets = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
            status,
            image_url
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

  useEffect(() => {
    fetchEntries();
  }, [user]);

  if (!user) {
    navigate('/auth');
    return null;
  }

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

      {entries.length === 0 ? (
        <Card className="p-12 text-center">
          <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Você ainda não possui bilhetes.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry) => {
            const raffle = entry.raffles as any;
            const ticketCount = entry.amount_paid / 10; // Assuming entry_cost is 10 RZ

            return (
              <Card 
                key={entry.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/raffles/${raffle.id}`)}
              >
                {raffle.image_url && (
                  <div className="w-full h-48 overflow-hidden">
                    <img 
                      src={raffle.image_url} 
                      alt={raffle.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{raffle.title}</h3>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Bilhetes</span>
                      <span className="font-bold text-primary">{ticketCount}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <span className="text-muted-foreground">Comprado há</span>
                    <span className="font-medium">
                      {formatDistanceToNow(new Date(entry.created_at), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`font-medium ${
                      raffle.status === 'active' ? 'text-green-500' : 'text-muted-foreground'
                    }`}>
                      {raffle.status === 'active' ? 'Ativa' : 'Finalizada'}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RaffleTickets;
