import { useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/ui/lazy-image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PressArticle } from "@/services/press";
import { track } from "@/lib/analytics";

interface PressCardProps {
  article: PressArticle;
}

export function PressCard({ article }: PressCardProps) {
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
      return format(new Date(dateString), "dd 'de' MMM 'de' yyyy", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <>
      <article className="relative bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-border/50 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group cursor-pointer overflow-hidden" onClick={handleReadMore}>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-[#ff2389]/[0.02] pointer-events-none" />
        
        <div className="relative">
          {/* Header with Relevance and Vehicle */}
          <div className="p-4 pb-2 flex items-start justify-between">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/20 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Alta Relevância
            </div>
            
            {article.logo_url ? (
              <div className="h-6 flex items-center">
                <LazyImage
                  src={article.logo_url}
                  alt={`Logo do ${article.vehicle}`}
                  className="h-full w-auto object-contain bg-white/95 rounded-md px-2 py-0.5 shadow-sm"
                  placeholder={
                    <div className="h-6 w-14 bg-muted rounded-md flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">{article.vehicle}</span>
                    </div>
                  }
                />
              </div>
            ) : (
              <div className="h-6 flex items-center">
                <div className="bg-white/95 rounded-md px-2 py-0.5 text-black text-xs font-semibold shadow-sm">
                  {article.vehicle}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="px-4 pb-4 space-y-2">
            <h3 className="text-base font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>
            
            {article.summary && (
              <p className="text-sm text-muted-foreground/90 line-clamp-2 leading-relaxed">
                {article.summary}
              </p>
            )}
            
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                {article.vehicle}
              </div>
              <span className="text-xs text-muted-foreground/80">{formatDate(article.published_at)}</span>
            </div>
            
            {/* Read More Indicator */}
            <div className="flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity pt-1">
              <span>Ler mais</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
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
            </div>
          </DialogHeader>
          
          <div className="overflow-auto max-h-[60vh] space-y-4">

            {/* Article Content */}
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