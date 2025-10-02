import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit2, Trash2, Upload, Calendar, Trophy, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RewardMilestone {
  id: string;
  days_required: number;
  reward_amount: number;
  reward_title: string;
  reward_description?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
}

const AdminRewards = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [milestones, setMilestones] = useState<RewardMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMilestone, setEditingMilestone] = useState<RewardMilestone | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    days_required: 7,
    reward_amount: 50,
    reward_title: '',
    reward_description: '',
    image_url: ''
  });

  useEffect(() => {
    if (user) {
      fetchMilestones();
    }
  }, [user]);

  const fetchMilestones = async () => {
    try {
      const { data, error } = await supabase
        .from('reward_milestones')
        .select('*')
        .order('days_required', { ascending: true });

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error fetching milestones:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar marcos de recompensa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, milestoneId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `rewards/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      if (milestoneId) {
        // Update existing milestone
        const { error: updateError } = await supabase
          .from('reward_milestones')
          .update({ image_url: publicUrl })
          .eq('id', milestoneId);

        if (updateError) throw updateError;
        fetchMilestones();
      } else {
        // Set for new milestone
        setFormData(prev => ({ ...prev, image_url: publicUrl }));
      }

      toast({
        title: "Sucesso",
        description: "Imagem carregada com sucesso",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erro",
        description: "Falha ao fazer upload da imagem",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveMilestone = async () => {
    try {
      if (editingMilestone) {
        const { error } = await supabase
          .from('reward_milestones')
          .update({
            days_required: formData.days_required,
            reward_amount: formData.reward_amount,
            reward_title: formData.reward_title,
            reward_description: formData.reward_description,
            image_url: formData.image_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMilestone.id);

        if (error) throw error;
        toast({ title: "Sucesso", description: "Marco atualizado com sucesso" });
      } else {
        const { error } = await supabase
          .from('reward_milestones')
          .insert([formData]);

        if (error) throw error;
        toast({ title: "Sucesso", description: "Marco criado com sucesso" });
      }

      setIsDialogOpen(false);
      setEditingMilestone(null);
      resetForm();
      fetchMilestones();
    } catch (error) {
      console.error('Error saving milestone:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar marco de recompensa",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este marco?')) return;

    try {
      const { error } = await supabase
        .from('reward_milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: "Sucesso", description: "Marco excluído com sucesso" });
      fetchMilestones();
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir marco",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (milestone: RewardMilestone) => {
    setEditingMilestone(milestone);
    setFormData({
      days_required: milestone.days_required,
      reward_amount: milestone.reward_amount,
      reward_title: milestone.reward_title,
      reward_description: milestone.reward_description || '',
      image_url: milestone.image_url || ''
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      days_required: 7,
      reward_amount: 50,
      reward_title: '',
      reward_description: '',
      image_url: ''
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

  const getMilestoneIcon = (days: number) => {
    if (days <= 7) return <Gift className="w-8 h-8 text-yellow-500" />;
    if (days <= 15) return <Trophy className="w-8 h-8 text-yellow-500" />;
    return <Calendar className="w-8 h-8 text-yellow-500" />;
  };

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 lg:ml-0 min-w-0">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Link>
              <h1 className="text-3xl font-bold mb-2">Recompensas de Login</h1>
              <p className="text-muted-foreground">
                Gerencie os marcos de recompensa para logins consecutivos
              </p>
            </div>
            <Button 
              onClick={() => {
                resetForm();
                setEditingMilestone(null);
                setIsDialogOpen(true);
              }}
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Marco
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {milestones.map((milestone) => (
                <Card 
                  key={milestone.id}
                  className="border-2 border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent hover:border-yellow-500/40 transition-all"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-yellow-500/10">
                          {getMilestoneIcon(milestone.days_required)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{milestone.reward_title}</CardTitle>
                          <p className="text-sm text-muted-foreground">{milestone.days_required} dias</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {milestone.image_url && (
                      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={milestone.image_url} 
                          alt={milestone.reward_title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-yellow-500">
                        {milestone.reward_amount} RIOZ
                      </p>
                      {milestone.reward_description && (
                        <p className="text-sm text-muted-foreground">
                          {milestone.reward_description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => openEditDialog(milestone)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        onClick={() => handleDeleteMilestone(milestone.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="pt-2 border-t">
                      <Label htmlFor={`image-${milestone.id}`} className="text-sm text-muted-foreground cursor-pointer flex items-center gap-2 hover:text-foreground transition-colors">
                        <Upload className="w-4 h-4" />
                        {milestone.image_url ? 'Trocar imagem' : 'Adicionar imagem'}
                      </Label>
                      <input
                        id={`image-${milestone.id}`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, milestone.id)}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMilestone ? 'Editar Marco' : 'Novo Marco'}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes da recompensa de login consecutivo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="days">Dias Necessários</Label>
              <Input
                id="days"
                type="number"
                value={formData.days_required}
                onChange={(e) => setFormData(prev => ({ ...prev, days_required: parseInt(e.target.value) }))}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Quantidade de RIOZ</Label>
              <Input
                id="amount"
                type="number"
                value={formData.reward_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, reward_amount: parseInt(e.target.value) }))}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título da Recompensa</Label>
              <Input
                id="title"
                value={formData.reward_title}
                onChange={(e) => setFormData(prev => ({ ...prev, reward_title: e.target.value }))}
                placeholder="Ex: 7 Dias de Fogo! 🔥"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={formData.reward_description}
                onChange={(e) => setFormData(prev => ({ ...prev, reward_description: e.target.value }))}
                placeholder="Descrição da recompensa..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image-upload">Imagem Vertical (opcional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e)}
                  disabled={uploadingImage}
                />
                {uploadingImage && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                )}
              </div>
              {formData.image_url && (
                <p className="text-xs text-muted-foreground">Imagem carregada ✓</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveMilestone}
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-gray-900"
            >
              {editingMilestone ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRewards;
