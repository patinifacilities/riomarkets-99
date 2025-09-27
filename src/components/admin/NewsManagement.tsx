import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, ExternalLink, Calendar } from 'lucide-react';
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
  description: string;
  url: string;
  imageUrl: string;
  publishedDate: string;
  isPublished: boolean;
}

export const NewsManagement = () => {
  const [news, setNews] = useState<NewsItem[]>([
    {
      id: '1',
      title: 'Rio Markets lança nova funcionalidade de análise avançada',
      description: 'A plataforma introduz ferramentas de análise mais sofisticadas para melhorar a precisão das previsões.',
      url: 'https://example.com/news1',
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300',
      publishedDate: '2024-01-15',
      isPublished: true
    },
    {
      id: '2',
      title: 'Parceria estratégica com grandes investidores',
      description: 'Rio Markets anuncia parceria com fundos de investimento para expandir operações.',
      url: 'https://example.com/news2',
      imageUrl: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300',
      publishedDate: '2024-01-10',
      isPublished: true
    }
  ]);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    imageUrl: '',
    publishedDate: '',
    isPublished: true
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      url: '',
      imageUrl: '',
      publishedDate: '',
      isPublished: true
    });
    setEditingNews(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingNews) {
      setNews(prev => prev.map(item => 
        item.id === editingNews.id 
          ? { ...item, ...formData }
          : item
      ));
      toast({
        title: "Notícia atualizada!",
        description: "As alterações foram salvas com sucesso.",
      });
    } else {
      const newNewsItem: NewsItem = {
        id: `news_${Date.now()}`,
        ...formData
      };
      setNews(prev => [newNewsItem, ...prev]);
      toast({
        title: "Notícia criada!",
        description: "Nova notícia adicionada com sucesso.",
      });
    }
    
    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (newsItem: NewsItem) => {
    setEditingNews(newsItem);
    setFormData({
      title: newsItem.title,
      description: newsItem.description,
      url: newsItem.url,
      imageUrl: newsItem.imageUrl,
      publishedDate: newsItem.publishedDate,
      isPublished: newsItem.isPublished
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setNews(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Notícia removida!",
      description: "A notícia foi excluída com sucesso.",
    });
  };

  const togglePublish = (id: string) => {
    setNews(prev => prev.map(item => 
      item.id === id 
        ? { ...item, isPublished: !item.isPublished }
        : item
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Notícias</h2>
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
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição da notícia"
                  rows={3}
                  required
                />
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
                    type="date"
                    value={formData.publishedDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, publishedDate: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">URL da Imagem</label>
                <Input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
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

      <div className="grid gap-4">
        {news.map((newsItem) => (
          <Card key={newsItem.id}>
            <CardContent className="p-6">
              <div className="flex gap-4">
                {newsItem.imageUrl && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={newsItem.imageUrl} 
                      alt={newsItem.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg">{newsItem.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={newsItem.isPublished ? 'default' : 'secondary'}>
                        {newsItem.isPublished ? 'Publicado' : 'Rascunho'}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground">{newsItem.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(newsItem.publishedDate).toLocaleDateString('pt-BR')}
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
                      {newsItem.isPublished ? 'Despublicar' : 'Publicar'}
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
        ))}
      </div>
    </div>
  );
};