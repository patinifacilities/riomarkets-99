import { supabase } from '@/integrations/supabase/client';
import { WalletTransaction } from '@/types';

export interface TransactionFilters {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  status?: string;
  type?: string;
  q?: string;
}

export interface TransactionResponse {
  data: WalletTransaction[];
  total: number;
  page: number;
  totalPages: number;
}

export async function fetchTransactions(
  userId: string,
  filters: TransactionFilters = {}
): Promise<TransactionResponse> {
  if (!userId) throw new Error('User ID is required');

  const {
    page = 1,
    limit = 20,
    from,
    to,
    status,
    type,
    q
  } = filters;

  let query = supabase
    .from('wallet_transactions')
    .select('*, markets(titulo)', { count: 'exact' })
    .eq('user_id', userId);

  // Apply filters
  if (from) {
    query = query.gte('created_at', from);
  }
  if (to) {
    query = query.lte('created_at', to);
  }
  if (type && type !== 'todos') {
    query = query.eq('tipo', type);
  }
  if (q) {
    query = query.or(`descricao.ilike.%${q}%,markets.titulo.ilike.%${q}%`);
  }

  // Pagination
  const offset = (page - 1) * limit;
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  const totalPages = Math.ceil((count || 0) / limit);

  return {
    data: (data || []) as WalletTransaction[],
    total: count || 0,
    page,
    totalPages
  };
}

export async function exportTransactions(
  userId: string,
  filters: Omit<TransactionFilters, 'page' | 'limit'>,
  format: 'csv' | 'json'
): Promise<string> {
  if (!userId) throw new Error('User ID is required');

  // Fetch all matching transactions (no pagination for export)
  const { data } = await fetchTransactions(userId, { ...filters, limit: 10000 });

  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }

  // CSV format
  const headers = ['Data', 'Mercado', 'Tipo', 'Valor (Rioz Coin)', 'Descrição'];
  const csvHeaders = headers.join(',');
  
  const csvData = data.map(transaction => {
    const date = new Date(transaction.created_at).toLocaleDateString('pt-BR');
    const market = (transaction as any).markets?.titulo || 'N/A';
    const type = transaction.tipo === 'credito' ? 'Entrada' : 'Saída';
    const amount = transaction.valor.toLocaleString('pt-BR');
    const description = `"${transaction.descricao.replace(/"/g, '""')}"`;
    
    return [date, `"${market}"`, type, amount, description].join(',');
  }).join('\n');

  return `${csvHeaders}\n${csvData}`;
}