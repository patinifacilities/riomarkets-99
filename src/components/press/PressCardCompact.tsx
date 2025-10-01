import { useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PressArticle } from "@/services/press";
import { track } from "@/lib/analytics";

interface PressCardCompactProps {
  article: PressArticle;
}

export function PressCardCompact({ article }: PressCardCompactProps) {
  const [showModal, setShowModal] = useState(false);

  const handleReadMore = () => {
    track('click_press_article', {
      article_id: article.id,
      vehicle: article.vehicle,
      title: article.title
    });
    setShowModal(true);
  };

  const handleOpenExternal = () => {
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const getPriorityColor = (vehicle: string) => {
    // Define priority based on vehicle
    const highPriority = ['Folha de S.Paulo', 'O Globo', 'Estadão', 'UOL', 'G1'];
    const mediumPriority = ['Valor Econômico', 'InfoMoney', 'Exame', 'IstoÉ Dinheiro'];
    
    if (highPriority.some(v => vehicle.toLowerCase().includes(v.toLowerCase()))) {
      return 'bg-[#ff2389]/20 text-[#ff2389] border-[#ff2389]/30';
    } else if (mediumPriority.some(v => vehicle.toLowerCase().includes(v.toLowerCase()))) {
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  };

  const getPriorityLabel = (vehicle: string) => {
    const highPriority = ['Folha de S.Paulo', 'O Globo', 'Estadão', 'UOL', 'G1'];
    const mediumPriority = ['Valor Econômico', 'InfoMoney', 'Exame', 'IstoÉ Dinheiro'];
    
    if (highPriority.some(v => vehicle.toLowerCase().includes(v.toLowerCase()))) {
      return 'Alta';
    } else if (mediumPriority.some(v => vehicle.toLowerCase().includes(v.toLowerCase()))) {
      return 'Média';
    }
    return 'Normal';
  };

  return (
    <>
      <article className="bg-gradient-to-br from-card via-card to-card/80 rounded-xl border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group cursor-pointer p-5 relative overflow-hidden" onClick={handleReadMore}>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-[#ff2389]/[0.02] pointer-events-none" />
        
        <div className="flex items-start gap-4 relative z-10">
          {/* Vehicle Logo */}
          <div className="flex-shrink-0">
            {article.logo_url ? (
              <div className="w-16 h-10 flex items-center bg-white rounded-lg shadow-sm p-1.5">
                <LazyImage
                  src={article.logo_url}
                  alt={`Logo do ${article.vehicle}`}
                  className="w-full h-full object-contain"
                  placeholder={
                    <div className="w-16 h-10 bg-muted rounded-lg flex items-center justify-center">
                      <span className="text-xs text-muted-foreground font-semibold">{article.vehicle.slice(0, 3)}</span>
                    </div>
                  }
                />
              </div>
            ) : (
              <div className="w-16 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center">
                <span className="text-xs text-black font-bold">{article.vehicle.slice(0, 3)}</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-foreground font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors text-base">
                {article.title}
              </h3>
              <Badge className={`text-xs font-semibold flex-shrink-0 border ${getPriorityColor(article.vehicle)}`}>
                {getPriorityLabel(article.vehicle)}
              </Badge>
            </div>
            
            {article.summary && (
              <p className="text-sm text-muted-foreground/90 line-clamp-2 leading-relaxed mb-3">
                {article.summary}
              </p>
            )}
            
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground/80">{article.vehicle}</span>
              <span className="text-muted-foreground">{formatDate(article.published_at)}</span>
            </div>
          </div>
        </div>
        
        {/* Hover indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-[#ff2389] to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </article>

      {/* Reading Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold line-clamp-2 pr-8">
                {article.title}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {article.logo_url && (
                <img 
                  src={article.logo_url} 
                  alt={article.vehicle}
                  className="h-6 w-auto object-contain bg-white rounded px-1"
                />
              )}
              <span className="font-medium">{article.vehicle}</span>
              <span>•</span>
              <span>{formatDate(article.published_at)}</span>
              <Badge className={getPriorityColor(article.vehicle)}>
                {getPriorityLabel(article.vehicle)} relevância
              </Badge>
            </div>
          </DialogHeader>
          
          <div className="overflow-auto max-h-[60vh] space-y-4">
            <div className="prose prose-invert max-w-none">
              {article.summary && (
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  {article.summary}
                </p>
              )}
              
              <div className="text-foreground space-y-4">
                <p>
                  Esta é uma visualização da matéria "{article.title}" publicada por {article.vehicle}.
                </p>
                <p>
                  O Rio Markets tem sido destaque na mídia especializada em mercados preditivos e inovações financeiras. 
                  Nossa plataforma representa uma nova forma de análise de mercado baseada em inteligência coletiva.
                </p>
                <p>
                  Para ler o conteúdo completo da matéria, clique no botão abaixo para ser redirecionado ao site oficial.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Fechar
            </Button>
            <Button onClick={handleOpenExternal} className="gap-2">
              Ler matéria completa
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}