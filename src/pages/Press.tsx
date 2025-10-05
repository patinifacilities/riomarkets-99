import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Newspaper } from "lucide-react";
import { usePressStore } from "@/store/usePressStore";
import { PressCardCompact } from "@/components/press/PressCardCompact";
import { PressFilter } from "@/components/press/PressFilter";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { track } from "@/lib/analytics";
import { StarsBackground } from "@/components/ui/StarsBackground";

export default function Press() {
  const { articles, loading, error, fetchArticles, fetchVehicles } = usePressStore();

  useEffect(() => {
    track('view_press_page');
    fetchArticles();
    fetchVehicles();
  }, [fetchArticles, fetchVehicles]);

  const renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl border border-border p-4 space-y-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-full" />
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-6 w-32" />
        </div>
      ))}
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-16">
      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Newspaper className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Nenhuma matéria encontrada
      </h3>
      <p className="text-muted-foreground max-w-sm mx-auto">
        Não encontramos matérias com os filtros selecionados. Tente ajustar os critérios de busca.
      </p>
    </div>
  );

  const renderError = () => (
    <div className="text-center py-16">
      <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
        <Newspaper className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Erro ao carregar matérias
      </h3>
      <p className="text-muted-foreground max-w-sm mx-auto mb-4">
        Ocorreu um erro ao carregar as matérias da imprensa. Tente novamente.
      </p>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Notícias - Rio Markets</title>
        <meta name="description" content="As últimas notícias e acontecimentos do mundo. Mantenha-se atualizado com as principais informações em tempo real." />
        <meta property="og:title" content="Notícias - Rio Markets" />
        <meta property="og:description" content="Notícias e acontecimentos em tempo real" />
        <link rel="canonical" href="https://riomarkets.com/press" />
      </Helmet>

      <div className="min-h-screen relative">
        {/* Background with stars */}
        <div className="fixed inset-0 z-0 overflow-hidden">
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, #0a0a0a 0%, #1a0a1a 50%, #0a0a0a 100%)'
            }}
          >
            <StarsBackground />
          </div>
        </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <header className="text-center mb-12 relative">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text">
              Notícias
            </h1>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-600 to-[#ff2389] rounded-full animate-pulse-glow shadow-lg shadow-red-500/30">
              <div className="w-2 h-2 bg-white rounded-full animate-ping" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">LIVE</span>
            </div>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            O que está acontecendo no mundo
          </p>
        </header>

        {/* Filters - Hidden on mobile */}
        <div className="mb-8 hidden md:block">
          <PressFilter />
        </div>

        {/* Content */}
        <main>
          {loading && renderSkeletons()}
          
          {error && renderError()}
          
          {!loading && !error && articles.length === 0 && renderEmptyState()}
          
          {!loading && !error && articles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {articles.map((article) => (
                <PressCardCompact key={article.id} article={article} />
              ))}
            </div>
          )}
        </main>

        {/* Stats */}
        {!loading && !error && articles.length > 0 && (
          <footer className="text-center mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {articles.length} {articles.length === 1 ? 'matéria encontrada' : 'matérias encontradas'}
            </p>
          </footer>
        )}
      </div>
      </div>
    </>
  );
}