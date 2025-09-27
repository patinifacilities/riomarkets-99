import { supabase } from '@/integrations/supabase/client';

export interface ExchangeRate {
  price: number;
  change24h: number;
  updated_at: string;
  symbol: string;
}

export interface ExchangeResult {
  orderId: string;
  status: string;
  appliedPrice: number;
  amountRioz: number;
  amountBrl: number;
  feeRioz: number;
  feeBrl: number;
  newBalances: {
    rioz_balance: number;
    brl_balance: number;
  };
}

export interface ConversionPreview {
  inputAmount: number;
  outputAmount: number;
  fee: number;
  appliedPrice: number;
  feeRate: number;
  netAmount: number;
}

export class ExchangeService {
  private static readonly FEE_RATE = 0.02; // 2%
  private static readonly MIN_BRL = 5.00;
  private static readonly MAX_BRL = 5000.00;

  static async getCurrentRate(): Promise<ExchangeRate> {
    const { data, error } = await supabase.functions.invoke('get-rate');
    
    if (error) {
      throw new Error(`Failed to fetch rate: ${error.message}`);
    }
    
    return data;
  }

  static async performExchange(
    side: 'buy_rioz' | 'sell_rioz',
    amountInput: number,
    inputCurrency: 'BRL' | 'RIOZ'
  ): Promise<ExchangeResult> {
    const { data, error } = await supabase.functions.invoke('exchange-convert', {
      body: {
        side,
        amountInput,
        inputCurrency
      }
    });
    
    if (error) {
      throw new Error(`Exchange failed: ${error.message}`);
    }
    
    return data;
  }

  static async getHistory(page = 1, limit = 10) {
    const { data, error } = await supabase.functions.invoke('get-history', {
      body: { page, limit }
    });
    
    if (error) {
      throw new Error(`Failed to fetch history: ${error.message}`);
    }
    
    return data;
  }

  static calculatePreview(
    side: 'buy_rioz' | 'sell_rioz',
    inputAmount: number,
    inputCurrency: 'BRL' | 'RIOZ',
    currentPrice: number
  ): ConversionPreview {
    let outputAmount: number;
    let fee: number;
    let netAmount: number;

    if (side === 'buy_rioz') {
      if (inputCurrency === 'BRL') {
        // Input BRL, output Rioz
        const grossRioz = inputAmount / currentPrice;
        fee = grossRioz * this.FEE_RATE;
        outputAmount = grossRioz;
        netAmount = grossRioz - fee;
      } else {
        // Input Rioz, calculate BRL needed
        outputAmount = inputAmount;
        const brlNeeded = inputAmount * currentPrice;
        fee = inputAmount * this.FEE_RATE;
        netAmount = inputAmount - fee;
        outputAmount = brlNeeded;
      }
    } else {
      // sell_rioz
      if (inputCurrency === 'RIOZ') {
        // Input Rioz, output BRL
        const grossBrl = inputAmount * currentPrice;
        fee = grossBrl * this.FEE_RATE;
        outputAmount = grossBrl;
        netAmount = grossBrl - fee;
      } else {
        // Input BRL, calculate Rioz needed
        const riozNeeded = inputAmount / currentPrice;
        outputAmount = riozNeeded;
        fee = inputAmount * this.FEE_RATE;
        netAmount = inputAmount - fee;
      }
    }

    return {
      inputAmount,
      outputAmount,
      fee,
      appliedPrice: currentPrice,
      feeRate: this.FEE_RATE,
      netAmount
    };
  }

  static validateAmount(amountBrl: number): { valid: boolean; error?: string } {
    if (amountBrl < this.MIN_BRL) {
      return {
        valid: false,
        error: `Valor mínimo: R$ ${this.MIN_BRL.toFixed(2)}`
      };
    }
    
    if (amountBrl > this.MAX_BRL) {
      return {
        valid: false,
        error: `Valor máximo: R$ ${this.MAX_BRL.toFixed(2)}`
      };
    }
    
    return { valid: true };
  }

  static formatCurrency(value: number, currency: 'BRL' | 'RIOZ'): string {
    if (currency === 'BRL') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    } else {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
      }).format(value) + ' Rioz';
    }
  }

  static formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 4,
      maximumFractionDigits: 6
    }).format(price);
  }

  static formatPercentage(percentage: number): string {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  }
}