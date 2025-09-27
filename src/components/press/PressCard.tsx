import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/ui/lazy-image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PressArticle } from "@/services/press";
import { track } from "@/lib/analytics";

interface PressCardProps {
  article: PressArticle;
}

export function PressCard({ article }: PressCardProps) {
  const handleReadMore = () => {
    track('click_press_article', {
      article_id: article.id,
      vehicle: article.vehicle,
      title: article.title
    });
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
    <article className="bg-card rounded-xl border border-border hover:border-primary/40 transition-all duration-200 group">
      {/* Vehicle Logo */}
      <div className="p-4 pb-0">
        {article.logo_url ? (
          <div className="h-10 flex items-center">
            <LazyImage
              src={article.logo_url}
              alt={`Logo do ${article.vehicle}`}
              className="h-full w-auto object-contain bg-white rounded px-2 py-1"
              placeholder={
                <div className="h-10 w-20 bg-muted rounded flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">{article.vehicle}</span>
                </div>
              }
            />
          </div>
        ) : (
          <div className="h-10 flex items-center">
            <div className="bg-white rounded px-2 py-1 text-black text-sm font-medium">
              {article.vehicle}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="text-foreground font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {article.title}
        </h3>
        
        {article.summary && (
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {article.summary}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <span className="font-medium">{article.vehicle}</span>
          <span>{formatDate(article.published_at)}</span>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleReadMore}
          className="text-primary hover:text-primary-glow hover:underline p-0 h-auto justify-start group-hover:translate-x-1 transition-transform"
          aria-label={`Ler matéria completa no ${article.vehicle}`}
        >
          Ler matéria completa
          <ExternalLink className="ml-1 h-3 w-3" />
        </Button>
      </div>
    </article>
  );
}