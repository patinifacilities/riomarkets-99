import { useState } from 'react';
import { Search, Download, Calendar, Filter, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { useTransactionsStore } from '@/store/transactions.store';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';

interface TransactionsToolbarProps {
  onExport: (format: 'csv' | 'json') => Promise<void>;
  className?: string;
}

const TransactionsToolbar = ({ onExport, className }: TransactionsToolbarProps) => {
  const { filters, updateFilters, isExporting } = useTransactionsStore();
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isDateOpen, setIsDateOpen] = useState(false);

  const handleQuickDateFilter = (days: number | null) => {
    if (days === null) {
      // Clear date filter
      setDateRange({});
      updateFilters({ from: undefined, to: undefined });
      track('clear_date_filter_transactions');
    } else {
      const from = startOfDay(subDays(new Date(), days));
      const to = endOfDay(new Date());
      setDateRange({ from, to });
      updateFilters({
        from: from.toISOString(),
        to: to.toISOString()
      });
      track('apply_date_filter_transactions', { days });
    }
  };

  const handleCustomDateRange = (from?: Date, to?: Date) => {
    setDateRange({ from, to });
    updateFilters({
      from: from ? startOfDay(from).toISOString() : undefined,
      to: to ? endOfDay(to).toISOString() : undefined
    });
    track('apply_custom_date_range_transactions');
  };

  const handleSearch = (q: string) => {
    updateFilters({ q });
    track('search_transactions', { query_length: q.length });
  };

  const handleTypeFilter = (type: string) => {
    updateFilters({ type });
    track('apply_filter_transactions', { filter_type: 'type', value: type });
  };

  const handleExport = async (format: 'csv' | 'json') => {
    await onExport(format);
    track(`export_${format}_clicked`, {
      filters: filters,
      total_records: useTransactionsStore.getState().total
    });
  };

  const activeFiltersCount = [
    filters.from && filters.to,
    filters.type && filters.type !== 'todos',
    filters.q && filters.q.length > 0
  ].filter(Boolean).length;

  return (
    <div
      className={cn(
        "sticky top-16 z-30 backdrop-blur-md bg-background/80 border-b border-border shadow-sm",
        className
      )}
      aria-controls="transactions-table"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-center w-full max-w-4xl mx-auto">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por mercado ou descrição..."
                value={filters.q || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
                aria-label="Buscar transações"
              />
            </div>

            {/* Date Range Filter */}
            <div className="flex gap-2">
              <Button
                variant={filters.from ? "secondary" : "outline"}
                size="sm"
                onClick={() => handleQuickDateFilter(7)}
                className="whitespace-nowrap"
              >
                Últimos 7 dias
              </Button>
              <Button
                variant={filters.from && !dateRange.from ? "secondary" : "outline"}
                size="sm"
                onClick={() => handleQuickDateFilter(30)}
                className="whitespace-nowrap"
              >
                Últimos 30 dias
              </Button>
              
              <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "whitespace-nowrap",
                      (dateRange.from || dateRange.to) && "border-primary"
                    )}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Período personalizado
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      handleCustomDateRange(range?.from, range?.to);
                      if (range?.from && range?.to) {
                        setIsDateOpen(false);
                      }
                    }}
                    numberOfMonths={2}
                    locale={ptBR}
                  />
                  <div className="p-3 border-t flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleQuickDateFilter(null);
                        setIsDateOpen(false);
                      }}
                    >
                      Limpar
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Type Filter */}
            <Select value={filters.type || 'todos'} onValueChange={handleTypeFilter}>
              <SelectTrigger className="w-[140px]" aria-label="Filtrar por tipo">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="credito">Entradas</SelectItem>
                <SelectItem value="debito">Saídas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Badge Only */}
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Filter className="w-3 h-3 mr-1" />
                {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.from || filters.to || (filters.q && filters.q.length > 0)) && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
            {filters.from && filters.to && (
              <Badge variant="outline" className="text-xs">
                {format(new Date(filters.from), 'dd/MM/yyyy', { locale: ptBR })} - {format(new Date(filters.to), 'dd/MM/yyyy', { locale: ptBR })}
              </Badge>
            )}
            {filters.q && filters.q.length > 0 && (
              <Badge variant="outline" className="text-xs">
                Busca: "{filters.q}"
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsToolbar;