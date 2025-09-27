import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Newspaper } from "lucide-react";
import { usePressStore } from "@/store/usePressStore";
import { PressCard } from "@/components/press/PressCard";
import { PressFilter } from "@/components/press/PressFilter";
import { Skeleton } from "@/components/ui/loading-skeleton";
import { track } from "@/lib/analytics";

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
        <title>Na mídia - Rio Markets</title>
        <meta name="description" content="Veja o que a imprensa está falando sobre o Rio Markets. Reportagens, artigos e menções em grandes veículos de comunicação." />
        <meta property="og:title" content="Na mídia - Rio Markets" />
        <meta property="og:description" content="O que a imprensa está falando sobre o Rio Markets" />
        <link rel="canonical" href="https://riomarkets.com/press" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
            <Newspaper className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Na mídia
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            O que a imprensa está falando sobre o Rio Markets
          </p>
        </header>

        {/* Filters */}
        <div className="mb-8">
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
                <PressCard key={article.id} article={article} />
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
    </>
  );
}