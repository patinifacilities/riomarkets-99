import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { OptionProgressBar } from '@/components/ui/option-progress-bar';
import { BetSlider } from '@/components/markets/BetSlider';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CountdownTimer } from '@/components/raffle/CountdownTimer';

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

interface RaffleEntry {
  id: string;
  user_id: string;
  amount_paid: number;
  created_at: string;
}

const RaffleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [recentEntries, setRecentEntries] = useState<RaffleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState(false);
  const [amount, setAmount] = useState(10);

  const fetchRaffle = async () => {
    if (!id) return;
    
    const { data, error } = await supabase
      .from('raffles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching raffle:', error);
      toast.error('Erro ao carregar rifa');
      return;
    }

    setRaffle(data);
  };

  const fetchRecentEntries = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('raffle_entries')
      .select('id, user_id, amount_paid, created_at')
      .eq('raffle_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching entries:', error);
      return;
    }

    setRecentEntries(data || []);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchRaffle(), fetchRecentEntries()]);
      setLoading(false);
    };

    loadData();

    // Realtime updates
    const channel = supabase
      .channel(`raffle-${id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'raffles',
        filter: `id=eq.${id}`
      }, () => {
        fetchRaffle();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'raffle_entries',
        filter: `raffle_id=eq.${id}`
      }, () => {
        fetchRecentEntries();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleEnter = async () => {
    if (!user) {
      toast.error('Você precisa estar logado');
      navigate('/auth');
      return;
    }

    if (!profile) {
      toast.error('Perfil não encontrado');
      return;
    }

    if (profile.is_blocked) {
      toast.error('Sua conta está bloqueada');
      return;
    }

    if (!raffle) return;

    const ticketCount = Math.floor(amount / raffle.entry_cost);
    const totalCost = ticketCount * raffle.entry_cost;

    if (ticketCount === 0) {
      toast.error('Valor mínimo é 1 bilhete');
      return;
    }

    if (profile.saldo_moeda < totalCost) {
      toast.error('Saldo insuficiente');
      return;
    }

    setEntering(true);

    try {
      // Deduct balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ saldo_moeda: profile.saldo_moeda - totalCost })
        .eq('id', user.id);

      if (balanceError) throw balanceError;

      // Create entry
      const { error: entryError } = await supabase
        .from('raffle_entries')
        .insert({
          raffle_id: raffle.id,
          user_id: user.id,
          amount_paid: totalCost
        });

      if (entryError) throw entryError;

      toast.success(`${ticketCount} bilhete(s) comprado(s) com sucesso!`);
      setAmount(raffle.entry_cost);
      
      // Refresh data
      window.dispatchEvent(new Event('forceProfileRefresh'));
      await fetchRaffle();
      await fetchRecentEntries();
    } catch (error) {
      console.error('Error entering raffle:', error);
      toast.error('Erro ao participar da rifa');
    } finally {
      setEntering(false);
    }
  };

  const getTimeUntilStart = () => {
    if (!raffle?.start_date) return null;
    const startDate = new Date(raffle.start_date);
    const now = new Date();
    
    if (startDate <= now) return null;
    
    const diff = startDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const timeUntilStart = getTimeUntilStart();
  const hasStarted = !timeUntilStart;
  const progressPercent = raffle ? Math.min((raffle.current_value / raffle.goal_value) * 100, 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!raffle) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Rifa não encontrada</p>
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {raffle.image_url && (
            <div className="w-full aspect-video rounded-lg overflow-hidden">
              <img 
                src={raffle.image_url} 
                alt={raffle.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <Card className="p-6">
            <h1 className="text-2xl font-bold mb-2">{raffle.title}</h1>
            {raffle.description && (
              <p className="text-muted-foreground mb-4">{raffle.description}</p>
            )}
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Prêmio</p>
                <p className="text-lg font-semibold">{raffle.prize_description}</p>
              </div>

              {!hasStarted && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Começa em</p>
                  <p className="text-2xl font-bold text-primary animate-pulse">{timeUntilStart}</p>
                </div>
              )}

               {raffle.paused && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent animate-shimmer"></div>
                  <div className="relative flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                    <p className="text-lg font-bold text-yellow-500">Rifa Pausada</p>
                  </div>
                </div>
              )}

              {raffle.ends_at && <CountdownTimer endsAt={raffle.ends_at} />}

              <div>
                <p className="text-sm text-muted-foreground mb-2">Progresso</p>
                {progressPercent >= 78 ? (
                  <OptionProgressBar 
                    percentage={progressPercent}
                    variant="neutral"
                    className="h-3 animate-gradient"
                  />
                ) : (
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-700"
                      style={{
                        width: `${progressPercent}%`,
                        background: 'linear-gradient(90deg, hsl(var(--success)) 0%, hsl(var(--success)) 100%)'
                      }}
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {progressPercent.toFixed(1)}% da meta
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm text-muted-foreground">Custo por bilhete</span>
                <span className="text-lg font-bold">{raffle.entry_cost} RZ</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Entry Form */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Comprar Bilhetes</h2>
            
            <div className="space-y-4">
              <BetSlider
                balance={profile?.saldo_moeda || 0}
                onAmountChange={setAmount}
                estimatedReward={Math.floor(amount / raffle.entry_cost)}
                storageKey="raffleTicketAmount"
                disabled={!hasStarted || raffle.paused || raffle.status !== 'active'}
              />

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-primary" />
                  <span className="text-sm">Bilhetes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{Math.floor(amount / raffle.entry_cost)}</span>
                  <span className="text-sm text-muted-foreground">Bilhetes</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span className="text-sm">Total</span>
                <span className="text-xl font-bold">{Math.floor(amount / raffle.entry_cost) * raffle.entry_cost} RZ</span>
              </div>

              <Button
                onClick={handleEnter}
                disabled={entering || !hasStarted || raffle.paused || raffle.status !== 'active' || !user}
                className="w-full"
                size="lg"
              >
                {entering ? 'Processando...' : 'Confirmar'}
              </Button>
            </div>
          </Card>

          {/* Recent Entries */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Compras Recentes
            </h2>
            
            <div className="space-y-3">
              {recentEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma compra ainda
                </p>
              ) : (
                recentEntries.map((entry) => {
                  const tickets = entry.amount_paid / raffle.entry_cost;
                  return (
                    <div 
                      key={entry.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">
                          Usuário
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tickets} bilhete(s)
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.created_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RaffleDetail;