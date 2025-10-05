import { useState } from "react";
import { ExternalLink } from "lucide-react";
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

  // Get a placeholder image or use a gradient if no image provided
  const imageUrl = article.logo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(article.vehicle)}&size=400&background=random`;

  return (
    <>
      <article 
        className="relative bg-gradient-to-br from-card via-card to-card/80 rounded-2xl border border-border/50 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group cursor-pointer overflow-hidden flex flex-col"
        onClick={handleReadMore}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-[#ff2389]/[0.02] pointer-events-none" />
        
        <div className="relative flex flex-col h-full">
          {/* Image Header */}
          <div className="relative h-48 overflow-hidden rounded-t-2xl bg-muted/30">
            <LazyImage
              src={imageUrl}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              placeholder={
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-[#ff2389]/10 flex items-center justify-center">
                  <span className="text-4xl">{article.vehicle.charAt(0)}</span>
                </div>
              }
            />
            
            {/* Badge overlay on image */}
            <div className="absolute top-3 left-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground border border-primary/20 shadow-lg backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Alta Relevância
              </div>
            </div>

            {/* Vehicle logo badge */}
            {article.logo_url && (
              <div className="absolute top-3 right-3">
                <div className="h-8 bg-white/95 rounded-lg px-2 py-1 shadow-lg flex items-center">
                  <img
                    src={article.logo_url}
                    alt={`Logo ${article.vehicle}`}
                    className="h-full w-auto object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 flex-1 flex flex-col">
            <h3 className="text-base font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors mb-2">
              {article.title}
            </h3>
            
            {article.summary && (
              <p className="text-sm text-muted-foreground/90 line-clamp-3 leading-relaxed mb-3 flex-1">
                {article.summary}
              </p>
            )}
            
            <div className="flex items-center justify-between pt-3 border-t border-border/30 mt-auto">
              <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                {article.vehicle}
              </div>
              <span className="text-xs text-muted-foreground/80">{formatDate(article.published_at)}</span>
            </div>
            
            {/* Read More Indicator */}
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity pt-2">
              <span>Ler mais</span>
              <ExternalLink className="w-3 h-3" />
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
            {/* Article Image */}
            <div className="relative h-64 overflow-hidden rounded-xl">
              <img
                src={imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>

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
