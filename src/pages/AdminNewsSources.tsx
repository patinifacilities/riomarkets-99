import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Pencil, Trash2, Globe, Upload } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { supabase } from '@/integrations/supabase/client';

interface NewsSource {
  id: string;
  name: string;
  url: string;
  logo_url: string | null;
  is_active: boolean;
  last_scraped_at: string | null;
  created_at: string;
}

const AdminNewsSources = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<NewsSource | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    logo_url: '',
  });

  const queryClient = useQueryClient();

  // Fetch sources
  const { data: sources, isLoading } = useQuery({
    queryKey: ['news-sources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news_sources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as NewsSource[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingSource) {
        const { error } = await supabase
          .from('news_sources')
          .update(data)
          .eq('id', editingSource.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('news_sources')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-sources'] });
      toast.success(editingSource ? 'Fonte atualizada!' : 'Fonte adicionada!');
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro ao salvar fonte: ' + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('news_sources')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-sources'] });
      toast.success('Fonte removida!');
    },
    onError: (error) => {
      toast.error('Erro ao remover fonte: ' + error.message);
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('news_sources')
        .update({ is_active: !is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-sources'] });
      toast.success('Status atualizado!');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', url: '', logo_url: '' });
    setEditingSource(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (source: NewsSource) => {
    setEditingSource(source);
    setFormData({
      name: source.name,
      url: source.url,
      logo_url: source.logo_url || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.url) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    saveMutation.mutate(formData);
  };

  // Security check
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
      
      <div className="flex-1 lg:ml-0 overflow-x-hidden">
        <div className="max-w-6xl mx-auto px-4 py-8 overflow-x-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link to="/admin/news" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar para Notícias
              </Link>
              <h1 className="text-3xl font-bold mb-2">Fontes de Notícias</h1>
              <p className="text-muted-foreground">
                Gerenciar fontes jornalísticas para scraping automático
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="destructive" className="text-xs">
                ADMIN
              </Badge>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Fonte
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources?.map((source) => (
                <Card key={source.id} className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    {source.logo_url ? (
                      <img 
                        src={source.logo_url} 
                        alt={source.name}
                        className="h-10 w-auto object-contain"
                      />
                    ) : (
                      <Globe className="h-10 w-10 text-muted-foreground" />
                    )}
                    <Badge variant={source.is_active ? 'default' : 'secondary'}>
                      {source.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-lg mb-2">{source.name}</h3>
                  <p className="text-sm text-muted-foreground mb-1 truncate">
                    {source.url}
                  </p>
                  {source.last_scraped_at && (
                    <p className="text-xs text-muted-foreground mb-4">
                      Último scraping: {new Date(source.last_scraped_at).toLocaleString('pt-BR')}
                    </p>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(source)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={source.is_active ? 'secondary' : 'default'}
                      onClick={() => toggleActiveMutation.mutate({ id: source.id, is_active: source.is_active })}
                    >
                      {source.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja remover esta fonte?')) {
                          deleteMutation.mutate(source.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSource ? 'Editar Fonte' : 'Nova Fonte'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Fonte *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: G1, Folha, UOL..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="url">URL do Portal *</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://exemplo.com.br"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="logo_url">URL da Logo</Label>
                  <Input
                    id="logo_url"
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    placeholder="https://exemplo.com.br/logo.png"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default AdminNewsSources;
