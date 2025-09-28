import { supabase } from '@/integrations/supabase/client';

export interface ExchangeTransaction {
  id: string;
  user_id: string;
  tipo: 'compra_rioz' | 'venda_rioz';
  valor: number;
  descricao: string;
  created_at: string;
}

export const logExchangeTransaction = async (
  userId: string,
  type: 'compra_rioz' | 'venda_rioz',
  amount: number,
  description: string
): Promise<void> => {
  try {
    const transactionId = `exchange_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { error } = await supabase
      .from('wallet_transactions')
      .insert({
        id: transactionId,
        user_id: userId,
        tipo: type === 'compra_rioz' ? 'debito' : 'credito',
        valor: Math.round(amount),
        descricao: description
      });

    if (error) {
      console.error('Error logging exchange transaction:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to log exchange transaction:', error);
    throw error;
  }
};