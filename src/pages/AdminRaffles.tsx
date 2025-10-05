import { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Trophy, Pause, Play, Image as ImageIcon, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RaffleImageUpload } from '@/components/admin/RaffleImageUpload';
import { Switch } from '@/components/ui/switch';

interface Raffle {
  id: string;
  title: string;
  description?: string;
  prize_description: string;
  image_url?: string;
  goal_value: number;
  current_value: number;
  payout_value: number;
  entry_cost: number;
  status: string;
  start_date: string;
  ends_at?: string;
  paused: boolean;
  winner_user_id?: string;
  created_at: string;
  updated_at: string;
  images?: string[];  // Array of images for carousel
}

const AdminRaffles = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRaffle, setEditingRaffle] = useState<Raffle | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  const toggleMaintenanceMode = async (newMode: boolean) => {
    setMaintenanceMode(newMode);
    
    // Update all active raffles to be paused/unpaused
    const { error } = await supabase
      .from('raffles')
      .update({ paused: newMode })
      .eq('status', 'active');
    
    if (error) {
      toast.error('Erro ao atualizar modo manutenção');
      setMaintenanceMode(!newMode); // Revert on error
    } else {
      toast.success(newMode ? 'Modo manutenção ativado - rifas pausadas' : 'Modo manutenção desativado - rifas ativas');
      fetchRaffles(); // Refresh raffles
    }
  };
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prize_description: '',
    images: [] as string[],
    payout_value: '',
    goal_value: '',
    entry_cost: '10',
    status: 'active',
    start_date: new Date().toISOString().slice(0, 16),
    ends_at: ''
  });

  useEffect(() => {
    if (user) {
      fetchRaffles();
    }
  }, [user]);

  const fetchRaffles = async () => {
    try {
      const { data, error } = await supabase
        .from('raffles')
        .select('*')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRaffles(data || []);
      
      // Check if any raffles are paused to set maintenance mode
      const anyPaused = data?.some(r => r.paused && r.status !== 'completed');
      if (anyPaused) setMaintenanceMode(true);
    } catch (error) {
      console.error('Error fetching raffles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(raffles);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setRaffles(items);

    // Update display_order for all raffles
    try {
      const updates = items.map((raffle, index) => ({
        id: raffle.id,
        display_order: index
      }));

      for (const update of updates) {
        await supabase
          .from('raffles')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      toast.success('Ordem atualizada com sucesso!');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erro ao atualizar ordem');
      fetchRaffles(); // Revert on error
    }
  };

  const handleSave = async () => {
    try {
      // Get first image from carousel or null
      const primaryImage = formData.images.length > 0 ? formData.images[0] : null;
      
      const raffleData = {
        title: formData.title,
        description: formData.description || null,
        prize_description: formData.prize_description,
        image_url: primaryImage,
        payout_value: parseFloat(formData.payout_value),
        goal_value: parseFloat(formData.goal_value),
        entry_cost: parseInt(formData.entry_cost),
        status: formData.status,
        start_date: formData.start_date,
        ends_at: formData.ends_at || null
      };

      if (editingRaffle) {
        const { error } = await supabase
          .from('raffles')
          .update(raffleData as any)
          .eq('id', editingRaffle.id);

        if (error) throw error;
        toast.success('Rifa atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('raffles')
          .insert(raffleData);

        if (error) throw error;
        toast.success('Rifa criada com sucesso!');
      }

      setDialogOpen(false);
      resetForm();
      fetchRaffles();
    } catch (error) {
      console.error('Error saving raffle:', error);
      toast.error('Erro ao salvar a rifa');
    }
  };

  const handleTogglePause = async (raffle: Raffle) => {
    try {
      const { error } = await supabase
        .from('raffles')
        .update({ paused: !raffle.paused })
        .eq('id', raffle.id);

      if (error) throw error;
      toast.success(raffle.paused ? 'Rifa despausada' : 'Rifa pausada');
      fetchRaffles();
    } catch (error) {
      console.error('Error toggling pause:', error);
      toast.error('Erro ao pausar/despausar rifa');
    }
  };

  const handleEdit = (raffle: Raffle) => {
    setEditingRaffle(raffle);
    const images = raffle.image_url ? [raffle.image_url] : [];
    setFormData({
      title: raffle.title,
      description: raffle.description || '',
      prize_description: raffle.prize_description,
      images: images,
      payout_value: raffle.payout_value.toString(),
      goal_value: raffle.goal_value.toString(),
      entry_cost: raffle.entry_cost.toString(),
      status: raffle.status,
      start_date: raffle.start_date.slice(0, 16),
      ends_at: raffle.ends_at ? raffle.ends_at.split('T')[0] : ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta rifa?')) return;

    try {
      const { error } = await supabase
        .from('raffles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Rifa excluída com sucesso!');
      fetchRaffles();
    } catch (error) {
      console.error('Error deleting raffle:', error);
      toast.error('Erro ao excluir a rifa');
    }
  };

  const resetForm = () => {
    setEditingRaffle(null);
    setFormData({
      title: '',
      description: '',
      prize_description: '',
      images: [],
      payout_value: '',
      goal_value: '',
      entry_cost: '10',
      status: 'active',
      start_date: new Date().toISOString().slice(0, 16),
      ends_at: ''
    });
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 lg:ml-0 min-w-0">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  <Trophy className="w-8 h-8 text-primary" />
                  Gerenciar Rifas
                </h1>
                <p className="text-muted-foreground">
                  Crie e gerencie rifas para os usuários
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => navigate('/admin/raffle-slider')}
                >
                  <ImageIcon className="w-4 h-4" />
                  Slider
                </Button>
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Nova Rifa
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingRaffle ? 'Editar Rifa' : 'Nova Rifa'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Nome da rifa"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descrição da rifa"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prize">Descrição do Prêmio</Label>
                      <Input
                        id="prize"
                        value={formData.prize_description}
                        onChange={(e) => setFormData({ ...formData, prize_description: e.target.value })}
                        placeholder="Ex: iPhone 15 Pro"
                      />
                    </div>
                    <div>
                      <Label>Imagens da Rifa</Label>
                      <RaffleImageUpload
                        raffleId={editingRaffle?.id}
                        images={formData.images}
                        onChange={(images) => setFormData({ ...formData, images })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="payout">Valor do Prêmio (RZ)</Label>
                        <Input
                          id="payout"
                          type="number"
                          value={formData.payout_value}
                          onChange={(e) => setFormData({ ...formData, payout_value: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="goal">Meta (RZ)</Label>
                        <Input
                          id="goal"
                          type="number"
                          value={formData.goal_value}
                          onChange={(e) => setFormData({ ...formData, goal_value: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="entry">Custo de Entrada (RZ)</Label>
                        <Input
                          id="entry"
                          type="number"
                          value={formData.entry_cost}
                          onChange={(e) => setFormData({ ...formData, entry_cost: e.target.value })}
                          placeholder="10"
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Ativa</SelectItem>
                            <SelectItem value="completed">Concluída</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="start">Data de Início</Label>
                      <Input
                        id="start"
                        type="datetime-local"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ends">Data de Término (Opcional)</Label>
                      <Input
                        id="ends"
                        type="date"
                        value={formData.ends_at}
                        onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleSave} className="w-full">
                      {editingRaffle ? 'Salvar Alterações' : 'Criar Rifa'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Rifas Cadastradas</CardTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor="maintenance-mode" className="text-sm">Modo Manutenção</Label>
                  <Switch
                    id="maintenance-mode"
                    checked={maintenanceMode}
                    onCheckedChange={toggleMaintenanceMode}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Prêmio</TableHead>
                        <TableHead>Progresso</TableHead>
                        <TableHead>Custo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <Droppable droppableId="raffles">
                      {(provided) => (
                        <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                          {raffles.map((raffle, index) => (
                            <Draggable key={raffle.id} draggableId={raffle.id} index={index}>
                              {(provided, snapshot) => (
                                <TableRow
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={snapshot.isDragging ? 'bg-muted' : ''}
                                >
                                  <TableCell {...provided.dragHandleProps}>
                                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                                  </TableCell>
                                  <TableCell className="font-medium">{raffle.title}</TableCell>
                                  <TableCell>{raffle.prize_description}</TableCell>
                                  <TableCell>
                                    {raffle.current_value} / {raffle.goal_value} RZ
                                    <div className="text-xs text-muted-foreground">
                                      {((raffle.current_value / raffle.goal_value) * 100).toFixed(0)}%
                                    </div>
                                  </TableCell>
                                  <TableCell>{raffle.entry_cost} RZ</TableCell>
                                  <TableCell>
                                    {maintenanceMode ? (
                                      <span className="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-500">
                                        🔧 Manutenção
                                      </span>
                                    ) : raffle.paused ? (
                                      <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-500">
                                        ⏸️ Pausada
                                      </span>
                                    ) : (
                                      <span className={`px-2 py-1 rounded text-xs ${
                                        raffle.status === 'active' 
                                          ? 'bg-green-500/20 text-green-500' 
                                          : 'bg-gray-500/20 text-gray-500'
                                      }`}>
                                        {raffle.status === 'active' ? 'Ativa' : 'Concluída'}
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleTogglePause(raffle)}
                                        title={raffle.paused ? 'Despausar' : 'Pausar'}
                                      >
                                        {raffle.paused ? (
                                          <Play className="w-4 h-4 text-green-500" />
                                        ) : (
                                          <Pause className="w-4 h-4 text-yellow-500" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEdit(raffle)}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(raffle.id)}
                                      >
                                        <Trash2 className="w-4 h-4 text-destructive" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </TableBody>
                      )}
                    </Droppable>
                  </Table>
                </DragDropContext>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminRaffles;