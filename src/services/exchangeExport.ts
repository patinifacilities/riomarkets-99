import { supabase } from '@/integrations/supabase/client';

export interface ExchangeExportFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  side?: 'buy_rioz' | 'sell_rioz' | 'all';
  status?: 'pending' | 'completed' | 'failed' | 'all';
  minAmount?: number;
  maxAmount?: number;
}

export interface ExchangeExportData {
  id: string;
  created_at: string;
  side: string;
  operation_type: string;
  amount_rioz: number;
  amount_brl: number;
  price_brl_per_rioz: number;
  fee_rioz: number;
  fee_brl: number;
  status: string;
}

export interface RatesHistoryExportData {
  timestamp: string;
  symbol: string;
  price: number;
  volume: number;
  change_from_previous?: number;
}

class ExchangeExportService {
  
  async exportExchangeHistory(
    userId: string,
    filters: ExchangeExportFilters = {},
    format: 'csv' | 'json' = 'csv'
  ): Promise<string> {
    try {
      let query = supabase
        .from('user_exchange_history_v')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      
      if (filters.side && filters.side !== 'all') {
        query = query.eq('side', filters.side);
      }
      
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      if (filters.minAmount) {
        query = query.gte('amount_rioz', filters.minAmount);
      }
      
      if (filters.maxAmount) {
        query = query.lte('amount_rioz', filters.maxAmount);
      }

      // Limit for export (max 10000 records)
      query = query.limit(filters.limit || 10000);

      const { data, error } = await query;
      
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Nenhum dado encontrado para exportar');
      }

      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      }

      // CSV format
      const headers = [
        'Data/Hora',
        'Operação',
        'Tipo',
        'Valor RIOZ',
        'Valor BRL',
        'Preço (BRL/RIOZ)',
        'Taxa RIOZ',
        'Taxa BRL',
        'Status'
      ];

      const csvRows = data.map(row => [
        new Date(row.created_at).toLocaleString('pt-BR'),
        row.side === 'buy_rioz' ? 'Compra' : 'Venda',
        row.operation_type || 'Spot',
        row.amount_rioz?.toFixed(6) || '0',
        row.amount_brl?.toFixed(2) || '0',
        row.price_brl_per_rioz?.toFixed(4) || '0',
        row.fee_rioz?.toFixed(6) || '0',
        row.fee_brl?.toFixed(2) || '0',
        row.status || 'N/A'
      ]);

      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => 
          row.map(field => 
            typeof field === 'string' && (field.includes(',') || field.includes('"'))
              ? `"${field.replace(/"/g, '""')}"`
              : field
          ).join(',')
        )
      ].join('\n');

      return csvContent;

    } catch (error) {
      console.error('Error exporting exchange history:', error);
      throw error;
    }
  }

  async exportRatesHistory(
    filters: { 
      startDate?: string; 
      endDate?: string; 
      symbol?: string;
      limit?: number;
    } = {},
    format: 'csv' | 'json' = 'csv'
  ): Promise<string> {
    try {
      let query = supabase
        .from('rates_history')
        .select('*')
        .eq('symbol', filters.symbol || 'RIOZBRL')
        .order('timestamp', { ascending: false });

      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate);
      }
      
      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate);
      }

      query = query.limit(filters.limit || 5000);

      const { data, error } = await query;
      
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Nenhum histórico de cotações encontrado');
      }

      // Calculate changes from previous
      const enrichedData = data.map((row, index) => {
        const previousPrice = index < data.length - 1 ? data[index + 1].price : null;
        const changeFromPrevious = previousPrice 
          ? ((row.price - previousPrice) / previousPrice) * 100 
          : 0;

        return {
          ...row,
          change_from_previous: changeFromPrevious
        };
      });

      if (format === 'json') {
        return JSON.stringify(enrichedData, null, 2);
      }

      // CSV format
      const headers = [
        'Data/Hora',
        'Símbolo',
        'Preço',
        'Volume',
        'Variação (%)'
      ];

      const csvRows = enrichedData.map(row => [
        new Date(row.timestamp).toLocaleString('pt-BR'),
        row.symbol,
        row.price.toFixed(4),
        row.volume?.toString() || '0',
        row.change_from_previous?.toFixed(2) || '0'
      ]);

      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => 
          row.map(field => 
            typeof field === 'string' && (field.includes(',') || field.includes('"'))
              ? `"${field.replace(/"/g, '""')}"`
              : field
          ).join(',')
        )
      ].join('\n');

      return csvContent;

    } catch (error) {
      console.error('Error exporting rates history:', error);
      throw error;
    }
  }

  downloadFile(content: string, filename: string, format: 'csv' | 'json') {
    const mimeType = format === 'csv' 
      ? 'text/csv;charset=utf-8;' 
      : 'application/json;charset=utf-8;';
    
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.${format}`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  formatCurrency(value: number, currency: 'BRL' | 'RIOZ'): string {
    if (currency === 'BRL') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    }
    
    return `${value.toFixed(6)} RIOZ`;
  }

  formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }
}

export const exchangeExportService = new ExchangeExportService();