import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Ticket, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Raffle {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prize_description: string;
  payout_value: number;
  goal_value: number;
  current_value: number;
  entry_cost: number;
  status: string;
  ends_at: string | null;
}

const Raffles = () => {
  const { user } = useAuth();
  const { data: profile, refetch: refetchProfile } = useProfile(user?.id);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    fetchRaffles();
    
    // Subscribe to raffle updates
    const channel = supabase
      .channel('raffles_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'raffles'
        },
        () => {
          fetchRaffles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  const handleEnterRaffle = async (raffle: Raffle) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!profile || profile.saldo_moeda < raffle.entry_cost) {
      toast({
        title: 'Saldo insuficiente',
        description: `Você precisa de ${raffle.entry_cost} RZ para participar desta rifa.`,
        variant: 'destructive'
      });
      return;
    }

    setEntering(prev => ({ ...prev, [raffle.id]: true }));

    try {
      // Deduct balance
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ saldo_moeda: profile.saldo_moeda - raffle.entry_cost })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Create entry
      const { error: entryError } = await supabase
        .from('raffle_entries')
        .insert({
          raffle_id: raffle.id,
          user_id: user.id,
          amount_paid: raffle.entry_cost
        });

      if (entryError) throw entryError;

      toast({
        title: 'Participação confirmada!',
        description: `Você está concorrendo a ${raffle.prize_description}`,
      });

      refetchProfile();
      fetchRaffles();
    } catch (error) {
      console.error('Error entering raffle:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível participar da rifa. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setEntering(prev => ({ ...prev, [raffle.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Trophy className="w-8 h-8 text-primary" />
            Rifas
          </h1>
          <p className="text-muted-foreground">
            Participe das rifas e concorra a prêmios incríveis!
          </p>
        </div>

        {raffles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Ticket className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma rifa disponível no momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {raffles.map(raffle => {
              const progress = (raffle.current_value / raffle.goal_value) * 100;
              const isCompleted = raffle.status === 'completed';

              return (
                <Card key={raffle.id} className={isCompleted ? 'opacity-75' : ''}>
                  {raffle.image_url && (
                    <div className="w-full h-48 overflow-hidden rounded-t-lg">
                      <img 
                        src={raffle.image_url} 
                        alt={raffle.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{raffle.title}</span>
                      {isCompleted && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                          Encerrada
                        </span>
                      )}
                    </CardTitle>
                    {raffle.description && (
                      <p className="text-sm text-muted-foreground">{raffle.description}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Trophy className="w-4 h-4 text-primary" />
                      <span className="font-medium">{raffle.prize_description}</span>
                    </div>

                    {raffle.ends_at && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Termina em: {new Date(raffle.ends_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">
                          {raffle.current_value.toLocaleString('pt-BR')} / {raffle.goal_value.toLocaleString('pt-BR')} RZ
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    <div className="pt-2">
                      <Button
                        onClick={() => handleEnterRaffle(raffle)}
                        disabled={isCompleted || entering[raffle.id] || !user}
                        className="w-full"
                      >
                        {entering[raffle.id] ? 'Participando...' : `Participar (${raffle.entry_cost} RZ)`}
                      </Button>
                    </div>
                  </CardContent>
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
