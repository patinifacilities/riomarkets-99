import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Ticket } from 'lucide-react';
import { OptionProgressBar } from '@/components/ui/option-progress-bar';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Raffle {
  id: string;
  title: string;
  description: string;
  prize_description: string;
  image_url?: string;
  goal_value: number;
  current_value: number;
  entry_cost: number;
  status: string;
  start_date: string;
  ends_at?: string;
  paused: boolean;
}

const Raffles = () => {
  const navigate = useNavigate();
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRaffles = async () => {
    try {
      const { data, error } = await supabase
        .from('raffles')
        .select('*')
        .in('status', ['active', 'completed'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRaffles(data || []);
    } catch (error) {
      console.error('Error fetching raffles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRaffles();

    const channel = supabase
      .channel('raffles_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'raffles'
      }, () => {
        fetchRaffles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getTimeUntilStart = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    
    if (start <= now) return null;
    
    return formatDistanceToNow(start, { addSuffix: true, locale: ptBR });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Ticket className="w-8 h-8 text-primary" />
          Rifas
        </h1>
        <p className="text-muted-foreground">
          Participe das rifas e concorra a prêmios incríveis!
        </p>
      </div>

      {raffles.length === 0 ? (
        <Card className="p-12 text-center">
          <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma rifa disponível no momento.</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {raffles.map((raffle) => {
            const progressPercent = Math.min((raffle.current_value / raffle.goal_value) * 100, 100);
            const timeUntilStart = getTimeUntilStart(raffle.start_date);
            const hasStarted = !timeUntilStart;

            return (
              <Card 
                key={raffle.id} 
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
                    {raffle.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{raffle.description}</p>
                    )}
                  </div>

                  {!hasStarted && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Começa {timeUntilStart}</p>
                    </div>
                  )}

                  {raffle.paused && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent animate-shimmer"></div>
                      <div className="relative flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                        <p className="text-sm font-bold text-yellow-500">Pausada</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Prêmio</span>
                      <span className="font-semibold">{raffle.prize_description}</span>
                    </div>

                    <OptionProgressBar 
                      percentage={progressPercent}
                      variant="neutral"
                      className="h-2"
                    />

                    <div className="flex items-center justify-between text-sm pt-2">
                      <span className="text-muted-foreground">Bilhete</span>
                      <span className="font-bold text-primary">{raffle.entry_cost} RZ</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/raffles/${raffle.id}`);
                    }}
                  >
                    Participar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Raffles;