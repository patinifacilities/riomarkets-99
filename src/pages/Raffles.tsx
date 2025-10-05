import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Ticket } from 'lucide-react';
import { OptionProgressBar } from '@/components/ui/option-progress-bar';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { RaffleSlider } from '@/components/raffle/RaffleSlider';

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
  const { user } = useAuth();
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasTickets, setHasTickets] = useState(false);

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

  const checkUserTickets = async () => {
    if (!user?.id) {
      setHasTickets(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('raffle_entries')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      if (error) throw error;
      setHasTickets((data || []).length > 0);
    } catch (error) {
      console.error('Error checking user tickets:', error);
      setHasTickets(false);
    }
  };

  useEffect(() => {
    fetchRaffles();
    checkUserTickets();

    const channel = supabase
      .channel('raffles_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'raffles'
      }, () => {
        fetchRaffles();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'raffle_entries',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        checkUserTickets();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

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
    <div className="pb-24 md:pb-8">
      <RaffleSlider />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <Ticket className="w-8 h-8 text-primary" />
                Rifas
              </h1>
              <p className="text-muted-foreground">
                Participe das rifas e concorra a prêmios incríveis!
              </p>
            </div>
            {hasTickets && user && (
              <Button 
                variant="outline"
                onClick={() => navigate('/raffle-tickets')}
                disabled={!user}
                className="relative overflow-hidden flex items-center gap-2 bg-gradient-to-r from-[#ffd700]/20 via-[#ffed4e]/20 to-[#ffd700]/20 border-[#ffd700]/30 hover:from-[#ffd700]/30 hover:via-[#ffed4e]/30 hover:to-[#ffd700]/30 disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffd700]/30 to-transparent animate-shimmer-slow" 
                  style={{ backgroundSize: '200% 100%' }}
                />
                <Ticket className="w-4 h-4 relative z-10 text-[#ffd700]" />
                <span className="relative z-10 font-bold bg-gradient-to-r from-[#ffd700] via-[#ffed4e] to-[#ffd700] bg-clip-text text-transparent">
                  Meus Bilhetes
                </span>
              </Button>
            )}
          </div>
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
                  <div className="w-full aspect-square overflow-hidden">
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
                    <div className="relative overflow-hidden bg-gradient-to-r from-[#ffd700]/20 via-[#ffed4e]/20 to-[#ffd700]/20 border border-[#ffd700]/30 rounded-lg p-3">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ffd700]/30 to-transparent animate-shimmer-slow" 
                        style={{ backgroundSize: '200% 100%' }}
                      />
                      <p className="relative text-sm font-bold bg-gradient-to-r from-[#ffd700] via-[#ffed4e] to-[#ffd700] bg-clip-text text-transparent">
                        Resultado em {timeUntilStart}
                      </p>
                    </div>
                  )}

               {raffle.paused && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent" 
                           style={{ 
                             animation: 'shimmer 2s linear infinite',
                             backgroundSize: '200% 100%'
                           }}></div>
                      <div className="relative flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" 
                             style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
                        <p className="text-sm font-bold text-yellow-500">Rifa Pausada</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Prêmio</span>
                      <span className="font-semibold">{raffle.prize_description}</span>
                    </div>

                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

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
    </div>
  );
};

export default Raffles;