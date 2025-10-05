import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ExternalLink, Calendar, Link as LinkIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface NewsItem {
  id: string;
  title: string;
  summary: string | null;
  vehicle: string;
  logo_url: string | null;
  url: string;
  published_at: string;
  status: string;
  created_at: string;
}

export const NewsManagement = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScrapeDialogOpen, setIsScrapeDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    vehicle: '',
    logo_url: '',
    url: '',
    published_at: '',
    status: 'published' as 'published' | 'draft'
  });

  // Load press mentions from database
  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('press_mentions')
        .select('*')
        .order('published_at', { ascending: false });
      
      if (error) throw error;
      setNews(data || []);
    } catch (error) {
      console.error('Error loading news:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar notícias",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      summary: '',
      vehicle: '',
      logo_url: '',
      url: '',
      published_at: '',
      status: 'published'
    });
    setEditingNews(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingNews) {
        const { error } = await supabase
          .from('press_mentions')
          .update({
            title: formData.title,
            summary: formData.summary,
            vehicle: formData.vehicle,
            logo_url: formData.logo_url,
            url: formData.url,
            published_at: formData.published_at,
            status: formData.status
          })
          .eq('id', editingNews.id);
        
        if (error) throw error;
        
        toast({
          title: "Notícia atualizada!",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from('press_mentions')
          .insert({
            title: formData.title,
            summary: formData.summary,
            vehicle: formData.vehicle,
            logo_url: formData.logo_url,
            url: formData.url,
            published_at: formData.published_at,
            status: formData.status
          });
        
        if (error) throw error;
        
        toast({
          title: "Notícia criada!",
          description: "Nova notícia adicionada com sucesso.",
        });
      }
      
      resetForm();
      setIsDialogOpen(false);
      loadNews();
    } catch (error) {
      console.error('Error saving news:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar notícia",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (newsItem: NewsItem) => {
    setEditingNews(newsItem);
    setFormData({
      title: newsItem.title,
      summary: newsItem.summary || '',
      vehicle: newsItem.vehicle,
      logo_url: newsItem.logo_url || '',
      url: newsItem.url,
      published_at: newsItem.published_at,
      status: newsItem.status as 'published' | 'draft'
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('press_mentions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Notícia removida!",
        description: "A notícia foi excluída com sucesso.",
      });
      loadNews();
    } catch (error) {
      console.error('Error deleting news:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir notícia",
        variant: "destructive"
      });
    }
  };

  const togglePublish = async (id: string) => {
    try {
      const newsItem = news.find(n => n.id === id);
      if (!newsItem) return;
      
      const newStatus = newsItem.status === 'published' ? 'draft' : 'published';
      
      const { error } = await supabase
        .from('press_mentions')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      loadNews();
    } catch (error) {
      console.error('Error toggling publish:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status",
        variant: "destructive"
      });
    }
  };

  const handleScrapeNews = async () => {
    if (!scrapeUrl) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma URL válida",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsScraping(true);
      
      const { data, error } = await supabase.functions.invoke('scrape-news-url', {
        body: { url: scrapeUrl }
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao fazer scrape da notícia');
      }

      toast({
        title: "Notícia adicionada!",
        description: "A notícia foi extraída e salva com sucesso.",
      });

      setScrapeUrl('');
      setIsScrapeDialogOpen(false);
      loadNews();
    } catch (error) {
      console.error('Error scraping news:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao fazer scrape da notícia",
        variant: "destructive"
      });
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Notícias</h2>
        <div className="flex gap-2">
          <Dialog open={isScrapeDialogOpen} onOpenChange={setIsScrapeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <LinkIcon className="w-4 h-4" />
                Scrape Notícia
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Scrape Notícia</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL da Notícia</label>
                  <Input
                    type="url"
                    value={scrapeUrl}
                    onChange={(e) => setScrapeUrl(e.target.value)}
                    placeholder="https://exemplo.com/noticia"
                    disabled={isScraping}
                  />
                  <p className="text-xs text-muted-foreground">
                    Cole o link completo da notícia que deseja importar
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleScrapeNews} 
                    disabled={isScraping || !scrapeUrl}
                    className="flex-1"
                  >
                    {isScraping ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Extraindo...
                      </>
                    ) : (
                      'Confirmar'
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsScrapeDialogOpen(false)}
                    disabled={isScraping}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Notícia
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingNews ? 'Editar Notícia' : 'Nova Notícia'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título da notícia"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Resumo</label>
                <Textarea
                  value={formData.summary}
                  onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="Resumo da notícia"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Veículo</label>
                  <Input
                    value={formData.vehicle}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicle: e.target.value }))}
                    placeholder="Nome do veículo"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL da Logo</label>
                  <Input
                    type="url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, logo_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL da Notícia</label>
                  <Input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://..."
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Publicação</label>
                  <Input
                    type="datetime-local"
                    value={formData.published_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, published_at: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.status === 'published'}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.checked ? 'published' : 'draft' }))}
                />
                <label htmlFor="isPublished" className="text-sm font-medium">
                  Publicar imediatamente
                </label>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingNews ? 'Atualizar' : 'Criar'} Notícia
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma notícia encontrada
          </div>
        ) : (
          news.map((newsItem) => (
            <Card key={newsItem.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {newsItem.logo_url && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={newsItem.logo_url} 
                        alt={newsItem.vehicle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg">{newsItem.title}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={newsItem.status === 'published' ? 'default' : 'secondary'}>
                          {newsItem.status === 'published' ? 'Publicado' : 'Rascunho'}
                        </Badge>
                      </div>
                    </div>
                    
                    {newsItem.summary && (
                      <p className="text-muted-foreground text-sm">{newsItem.summary}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-medium">{newsItem.vehicle}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(newsItem.published_at).toLocaleDateString('pt-BR')}
                      </div>
                      <a 
                        href={newsItem.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Ver notícia
                      </a>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(newsItem)}
                        className="gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => togglePublish(newsItem.id)}
                      >
                        {newsItem.status === 'published' ? 'Despublicar' : 'Publicar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(newsItem.id)}
                        className="gap-2 text-danger hover:bg-danger/10"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};