import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { fetchTransactions, exportTransactions } from '@/services/transactions';
import { useTransactionsStore } from '@/store/transactions.store';
import TransactionsToolbar from '@/components/transactions/TransactionsToolbar';
import TransactionsTable from '@/components/transactions/TransactionsTable';
import TransactionsList from '@/components/transactions/TransactionsList';
import TransactionsSkeleton from '@/components/transactions/TransactionsSkeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { toast } from 'sonner';
import { Receipt, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { track } from '@/lib/analytics';

const Transactions = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const {
    transactions,
    total,
    totalPages,
    isLoading,
    isExporting,
    error,
    filters,
    setTransactions,
    setLoading,
    setExporting,
    setError,
    updateFilters
  } = useTransactionsStore();

  // Fetch transactions whenever filters change
  useEffect(() => {
    if (!user?.id) return;
    
    const loadTransactions = async () => {
      try {
        setLoading(true);
        track('view_transactions', { filters });
        
        const response = await fetchTransactions(user.id, filters);
        setTransactions(response.data, response.total, response.totalPages);
      } catch (error) {
        console.error('Error loading transactions:', error);
        setError(error instanceof Error ? error.message : 'Erro ao carregar transações');
        toast.error('Erro ao carregar transações');
      }
    };

    loadTransactions();
  }, [user?.id, filters, setTransactions, setLoading, setError]);

  // Track page view on mount
  useEffect(() => {
    track('view_transactions');
  }, []);

  const handlePageChange = (page: number) => {
    updateFilters({ page });
    track('paginate_transactions', { page });
  };

  const handleExport = async (format: 'csv' | 'json') => {
    if (!user?.id) return;
    
    try {
      setExporting(true);
      
      const content = await exportTransactions(user.id, {
        from: filters.from,
        to: filters.to,
        type: filters.type,
        q: filters.q
      }, format);
      
      // Create and download file
      const blob = new Blob([content], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transacoes_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Dados exportados como ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Erro ao exportar dados');
    } finally {
      setExporting(false);
    }
  };

  // Calculate stats from current transactions
  const stats = {
    totalTransactions: total,
    totalCredits: transactions.filter(t => t.tipo === 'credito').reduce((sum, t) => sum + t.valor, 0),
    totalDebits: transactions.filter(t => t.tipo === 'debito').reduce((sum, t) => sum + t.valor, 0)
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 pb-[env(safe-area-inset-bottom)] max-w-6xl">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Erro ao carregar transações</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-primary hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 pb-[env(safe-area-inset-bottom)] max-w-6xl">
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-muted rounded animate-pulse" />
                <div className="h-8 w-64 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-5 w-96 bg-muted rounded animate-pulse" />
            </div>
            
            {/* Stats cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-card border border-border rounded-lg animate-pulse" />
              ))}
            </div>

            {/* Toolbar skeleton */}
            <div className="h-16 bg-card border border-border rounded-lg animate-pulse" />
            
            {/* Content skeleton */}
            <TransactionsSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 pb-[env(safe-area-inset-bottom)] max-w-6xl">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
              <Receipt className="w-7 h-7 text-primary" />
              Minhas Transações
            </h1>
            <p className="text-muted-foreground mt-1">
              Histórico completo de movimentações da sua carteira
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 border-border bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Transações</p>
                  <p className="text-2xl font-bold text-foreground tabular-nums">
                    {stats.totalTransactions.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-primary/10">
                  <Receipt className="w-5 h-5 text-primary" />
                </div>
              </div>
            </Card>

            <Card className="p-4 border-border bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Recebido</p>
                  <p className="text-2xl font-bold text-success tabular-nums">
                    +{stats.totalCredits.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-success/10">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
              </div>
            </Card>

            <Card className="p-4 border-border bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Enviado</p>
                  <p className="text-2xl font-bold text-danger tabular-nums">
                    -{stats.totalDebits.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-danger/10">
                  <TrendingDown className="w-5 h-5 text-danger" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Sticky Toolbar */}
      <TransactionsToolbar onExport={handleExport} />

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-[env(safe-area-inset-bottom)] max-w-6xl">
        <div className="space-y-6">
          {/* Transactions Display */}
          {isMobile ? (
            <TransactionsList transactions={transactions} />
          ) : (
            <TransactionsTable transactions={transactions} />
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(Math.max(1, filters.page! - 1))}
                    className={filters.page === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  const currentPage = filters.page || 1;
                  
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }

                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => handlePageChange(pageNumber)}
                        isActive={currentPage === pageNumber}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(Math.min(totalPages, filters.page! + 1))}
                    className={filters.page === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>

      </div>
    </div>
  );
};


export default Transactions;