import React, { useState } from 'react';
import { Download, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { exchangeExportService, ExchangeExportFilters } from '@/services/exchangeExport';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';

interface ExchangeExportButtonsProps {
  className?: string;
}

const ExchangeExportButtons = ({ className }: ExchangeExportButtonsProps) => {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState<ExchangeExportFilters>({
    side: 'all',
    status: 'all',
    limit: 1000
  });

  const handleExport = async (format: 'csv' | 'json') => {
    if (!user) {
      toast.error('Você precisa estar logado para exportar dados');
      return;
    }

    setIsExporting(true);
    
    try {
      track('exchange_export_started', { 
        format, 
        filters: Object.keys(filters).length 
      });

      const content = await exchangeExportService.exportExchangeHistory(
        user.id,
        filters,
        format
      );

      const filename = `historico_exchange_${user.id}`;
      exchangeExportService.downloadFile(content, filename, format);

      track('exchange_export_completed', { 
        format, 
        recordCount: content.split('\n').length - 1 // Approximate for CSV
      });

      toast.success(`Histórico exportado em ${format.toUpperCase()} com sucesso!`);
      
    } catch (error) {
      console.error('Export error:', error);
      track('exchange_export_failed', { format, error: error.message });
      toast.error('Erro ao exportar histórico: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFilterChange = (key: keyof ExchangeExportFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Filtros de Exportação</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Data Inicial</Label>
                <Input
                  type="date"
                  className="h-8 text-xs"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Data Final</Label>
                <Input
                  type="date"
                  className="h-8 text-xs"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Tipo de Operação</Label>
              <Select 
                value={filters.side || 'all'} 
                onValueChange={(value) => handleFilterChange('side', value)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="buy_rioz">Compra</SelectItem>
                  <SelectItem value="sell_rioz">Venda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Status</Label>
              <Select 
                value={filters.status || 'all'} 
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Valor Mín. (RIOZ)</Label>
                <Input
                  type="number"
                  step="0.000001"
                  className="h-8 text-xs"
                  placeholder="0.000000"
                  value={filters.minAmount || ''}
                  onChange={(e) => handleFilterChange('minAmount', parseFloat(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Limite</Label>
                <Select 
                  value={filters.limit?.toString() || '1000'} 
                  onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                    <SelectItem value="1000">1.000</SelectItem>
                    <SelectItem value="5000">5.000</SelectItem>
                    <SelectItem value="10000">10.000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        onClick={() => handleExport('csv')}
        disabled={isExporting}
        variant="outline"
        size="sm"
      >
        <Download className="w-4 h-4 mr-2" />
        CSV
      </Button>

      <Button
        onClick={() => handleExport('json')}
        disabled={isExporting}
        variant="outline"
        size="sm"
      >
        <Download className="w-4 h-4 mr-2" />
        JSON
      </Button>
    </div>
  );
};

export default ExchangeExportButtons;