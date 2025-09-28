export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          correlation_id: string | null
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          correlation_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          correlation_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      balances: {
        Row: {
          brl_balance: number
          rioz_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          brl_balance?: number
          rioz_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          brl_balance?: number
          rioz_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          ativo: boolean
          created_at: string
          icon_url: string | null
          id: string
          nome: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          icon_url?: string | null
          id: string
          nome: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          icon_url?: string | null
          id?: string
          nome?: string
          ordem?: number
        }
        Relationships: []
      }
      exchange_events: {
        Row: {
          correlation_id: string | null
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          correlation_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      exchange_order_book: {
        Row: {
          amount_rioz: number
          created_at: string
          expires_at: string | null
          id: string
          order_type: string
          price_brl_per_rioz: number
          remaining_amount: number
          side: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_rioz: number
          created_at?: string
          expires_at?: string | null
          id?: string
          order_type?: string
          price_brl_per_rioz: number
          remaining_amount: number
          side: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_rioz?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          order_type?: string
          price_brl_per_rioz?: number
          remaining_amount?: number
          side?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exchange_orders: {
        Row: {
          amount_brl: number
          amount_rioz: number
          cancelled_at: string | null
          created_at: string
          fee_brl: number
          fee_rioz: number
          filled_at: string | null
          id: string
          price_brl_per_rioz: number
          side: string
          status: string
          user_id: string
        }
        Insert: {
          amount_brl: number
          amount_rioz: number
          cancelled_at?: string | null
          created_at?: string
          fee_brl?: number
          fee_rioz?: number
          filled_at?: string | null
          id?: string
          price_brl_per_rioz: number
          side: string
          status?: string
          user_id: string
        }
        Update: {
          amount_brl?: number
          amount_rioz?: number
          cancelled_at?: string | null
          created_at?: string
          fee_brl?: number
          fee_rioz?: number
          filled_at?: string | null
          id?: string
          price_brl_per_rioz?: number
          side?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      fiat_requests: {
        Row: {
          admin_notes: string | null
          amount_brl: number
          created_at: string
          id: string
          pix_key: string | null
          processed_at: string | null
          processed_by: string | null
          proof_url: string | null
          request_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount_brl: number
          created_at?: string
          id?: string
          pix_key?: string | null
          processed_at?: string | null
          processed_by?: string | null
          proof_url?: string | null
          request_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount_brl?: number
          created_at?: string
          id?: string
          pix_key?: string | null
          processed_at?: string | null
          processed_by?: string | null
          proof_url?: string | null
          request_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      market_order_book: {
        Row: {
          cancelled_at: string | null
          created_at: string | null
          filled_at: string | null
          id: string
          market_id: string
          price: number
          quantity: number
          side: string
          status: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string | null
          filled_at?: string | null
          id?: string
          market_id: string
          price: number
          quantity: number
          side: string
          status?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string | null
          filled_at?: string | null
          id?: string
          market_id?: string
          price?: number
          quantity?: number
          side?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_order_book_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      market_orders: {
        Row: {
          amount_rioz: number
          created_at: string | null
          filled_at: string | null
          id: string
          market_id: string
          odds: number
          probability_percent: number
          side: string
          status: string
          user_id: string
        }
        Insert: {
          amount_rioz: number
          created_at?: string | null
          filled_at?: string | null
          id?: string
          market_id: string
          odds: number
          probability_percent: number
          side: string
          status?: string
          user_id: string
        }
        Update: {
          amount_rioz?: number
          created_at?: string | null
          filled_at?: string | null
          id?: string
          market_id?: string
          odds?: number
          probability_percent?: number
          side?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_orders_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      market_stats: {
        Row: {
          id: string
          market_id: string
          participantes: number | null
          updated_at: string | null
          vol_24h: number | null
          vol_total: number | null
        }
        Insert: {
          id?: string
          market_id: string
          participantes?: number | null
          updated_at?: string | null
          vol_24h?: number | null
          vol_total?: number | null
        }
        Update: {
          id?: string
          market_id?: string
          participantes?: number | null
          updated_at?: string | null
          vol_24h?: number | null
          vol_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "market_stats_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: true
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          categoria: string
          created_at: string | null
          descricao: string | null
          destaque: boolean | null
          end_date: string
          id: string
          market_type: string
          odds: Json
          opcoes: Json
          periodicidade: string | null
          status: string | null
          thumbnail_url: string | null
          titulo: string
        }
        Insert: {
          categoria: string
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          end_date: string
          id: string
          market_type?: string
          odds: Json
          opcoes: Json
          periodicidade?: string | null
          status?: string | null
          thumbnail_url?: string | null
          titulo: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          descricao?: string | null
          destaque?: boolean | null
          end_date?: string
          id?: string
          market_type?: string
          odds?: Json
          opcoes?: Json
          periodicidade?: string | null
          status?: string | null
          thumbnail_url?: string | null
          titulo?: string
        }
        Relationships: []
      }
      orderbook_levels: {
        Row: {
          id: string
          orders_count: number
          price: number
          quantity: number
          side: string
          symbol: string
          total_value: number
          updated_at: string
        }
        Insert: {
          id?: string
          orders_count?: number
          price: number
          quantity?: number
          side: string
          symbol?: string
          total_value?: number
          updated_at?: string
        }
        Update: {
          id?: string
          orders_count?: number
          price?: number
          quantity?: number
          side?: string
          symbol?: string
          total_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      orderbook_ticks: {
        Row: {
          id: string
          price: number
          quantity: number
          side: string
          symbol: string
          timestamp: string
        }
        Insert: {
          id?: string
          price: number
          quantity: number
          side: string
          symbol?: string
          timestamp?: string
        }
        Update: {
          id?: string
          price?: number
          quantity?: number
          side?: string
          symbol?: string
          timestamp?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          cashed_out_at: string | null
          cashout_amount: number | null
          created_at: string | null
          entry_multiple: number | null
          entry_percent: number | null
          id: string
          market_id: string | null
          opcao_escolhida: string
          preco: number
          quantidade_moeda: number
          status: string | null
          user_id: string | null
        }
        Insert: {
          cashed_out_at?: string | null
          cashout_amount?: number | null
          created_at?: string | null
          entry_multiple?: number | null
          entry_percent?: number | null
          id: string
          market_id?: string | null
          opcao_escolhida: string
          preco: number
          quantidade_moeda: number
          status?: string | null
          user_id?: string | null
        }
        Update: {
          cashed_out_at?: string | null
          cashout_amount?: number | null
          created_at?: string | null
          entry_multiple?: number | null
          entry_percent?: number | null
          id?: string
          market_id?: string | null
          opcao_escolhida?: string
          preco?: number
          quantidade_moeda?: number
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      press_mentions: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          published_at: string
          status: string
          summary: string | null
          title: string
          updated_at: string
          url: string
          vehicle: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          published_at?: string
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
          url: string
          vehicle: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          published_at?: string
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          url?: string
          vehicle?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cpf: string | null
          created_at: string
          email: string
          id: string
          is_admin: boolean
          nivel: string
          nome: string
          profile_pic_url: string | null
          saldo_moeda: number
          updated_at: string
          username: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email: string
          id: string
          is_admin?: boolean
          nivel?: string
          nome: string
          profile_pic_url?: string | null
          saldo_moeda?: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string
          id?: string
          is_admin?: boolean
          nivel?: string
          nome?: string
          profile_pic_url?: string | null
          saldo_moeda?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          ip_address: unknown | null
          requests_count: number
          updated_at: string
          user_id: string | null
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          ip_address?: unknown | null
          requests_count?: number
          updated_at?: string
          user_id?: string | null
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: unknown | null
          requests_count?: number
          updated_at?: string
          user_id?: string | null
          window_start?: string
        }
        Relationships: []
      }
      rates: {
        Row: {
          change24h: number
          price: number
          symbol: string
          updated_at: string
        }
        Insert: {
          change24h?: number
          price: number
          symbol?: string
          updated_at?: string
        }
        Update: {
          change24h?: number
          price?: number
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      rates_history: {
        Row: {
          id: string
          price: number
          symbol: string
          timestamp: string
          volume: number
        }
        Insert: {
          id?: string
          price: number
          symbol?: string
          timestamp?: string
          volume?: number
        }
        Update: {
          id?: string
          price?: number
          symbol?: string
          timestamp?: string
          volume?: number
        }
        Relationships: []
      }
      reconciliation_reports: {
        Row: {
          brl_discrepancy: number
          created_at: string
          discrepancies_found: number
          id: string
          ledger_brl_balance: number
          ledger_rioz_balance: number
          report_data: Json | null
          report_date: string
          rioz_discrepancy: number
          status: string
          total_brl_balance: number
          total_rioz_balance: number
          total_users: number
        }
        Insert: {
          brl_discrepancy?: number
          created_at?: string
          discrepancies_found?: number
          id?: string
          ledger_brl_balance?: number
          ledger_rioz_balance?: number
          report_data?: Json | null
          report_date?: string
          rioz_discrepancy?: number
          status?: string
          total_brl_balance?: number
          total_rioz_balance?: number
          total_users?: number
        }
        Update: {
          brl_discrepancy?: number
          created_at?: string
          discrepancies_found?: number
          id?: string
          ledger_brl_balance?: number
          ledger_rioz_balance?: number
          report_data?: Json | null
          report_date?: string
          rioz_discrepancy?: number
          status?: string
          total_brl_balance?: number
          total_rioz_balance?: number
          total_users?: number
        }
        Relationships: []
      }
      request_logs: {
        Row: {
          correlation_id: string
          created_at: string
          duration_ms: number | null
          endpoint: string
          error_message: string | null
          id: string
          ip_address: unknown | null
          method: string
          request_size: number | null
          response_size: number | null
          stack_trace: string | null
          status_code: number | null
          user_id: string | null
        }
        Insert: {
          correlation_id: string
          created_at?: string
          duration_ms?: number | null
          endpoint: string
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          method: string
          request_size?: number | null
          response_size?: number | null
          stack_trace?: string | null
          status_code?: number | null
          user_id?: string | null
        }
        Update: {
          correlation_id?: string
          created_at?: string
          duration_ms?: number | null
          endpoint?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          method?: string
          request_size?: number | null
          response_size?: number | null
          stack_trace?: string | null
          status_code?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      results: {
        Row: {
          data_liquidacao: string | null
          market_id: string
          resultado_vencedor: string
          tx_executada: boolean | null
        }
        Insert: {
          data_liquidacao?: string | null
          market_id: string
          resultado_vencedor: string
          tx_executada?: boolean | null
        }
        Update: {
          data_liquidacao?: string | null
          market_id?: string
          resultado_vencedor?: string
          tx_executada?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "results_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: true
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          cashout_fee_percent: number | null
          created_at: string
          fee_percent: number
          id: string
          token_name: string | null
          updated_at: string
        }
        Insert: {
          cashout_fee_percent?: number | null
          created_at?: string
          fee_percent?: number
          id?: string
          token_name?: string | null
          updated_at?: string
        }
        Update: {
          cashout_fee_percent?: number | null
          created_at?: string
          fee_percent?: number
          id?: string
          token_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          id: string
          message: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          id?: string
          message: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          correlation_id: string | null
          created_at: string
          id: string
          metric_name: string
          metric_value: number
          tags: Json | null
          timestamp: string
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string
          id?: string
          metric_name: string
          metric_value: number
          tags?: Json | null
          timestamp?: string
        }
        Update: {
          correlation_id?: string | null
          created_at?: string
          id?: string
          metric_name?: string
          metric_value?: number
          tags?: Json | null
          timestamp?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          message: string
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message: string
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message?: string
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ui_events: {
        Row: {
          category_id: string | null
          created_at: string
          event_type: string
          id: string
          source: string
          user_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          source: string
          user_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_watchlist: {
        Row: {
          created_at: string | null
          id: string
          market_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          market_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          market_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_watchlist_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          created_at: string | null
          descricao: string
          id: string
          market_id: string | null
          tipo: string
          user_id: string | null
          valor: number
        }
        Insert: {
          created_at?: string | null
          descricao: string
          id: string
          market_id?: string | null
          tipo: string
          user_id?: string | null
          valor: number
        }
        Update: {
          created_at?: string | null
          descricao?: string
          id?: string
          market_id?: string | null
          tipo?: string
          user_id?: string | null
          valor?: number
        }
        Relationships: []
      }
    }
    Views: {
      press_mentions_published_v: {
        Row: {
          created_at: string | null
          id: string | null
          logo_url: string | null
          published_at: string | null
          summary: string | null
          title: string | null
          url: string | null
          vehicle: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          logo_url?: string | null
          published_at?: string | null
          summary?: string | null
          title?: string | null
          url?: string | null
          vehicle?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          logo_url?: string | null
          published_at?: string | null
          summary?: string | null
          title?: string | null
          url?: string | null
          vehicle?: string | null
        }
        Relationships: []
      }
      user_exchange_history_v: {
        Row: {
          amount_brl: number | null
          amount_rioz: number | null
          created_at: string | null
          fee_brl: number | null
          fee_rioz: number | null
          id: string | null
          operation_type: string | null
          price_brl_per_rioz: number | null
          side: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount_brl?: number | null
          amount_rioz?: number | null
          created_at?: string | null
          fee_brl?: number | null
          fee_rioz?: number | null
          id?: string | null
          operation_type?: never
          price_brl_per_rioz?: number | null
          side?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount_brl?: number | null
          amount_rioz?: number | null
          created_at?: string | null
          fee_brl?: number | null
          fee_rioz?: number | null
          id?: string | null
          operation_type?: never
          price_brl_per_rioz?: number | null
          side?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_change24h_from_history: {
        Args: { target_symbol: string }
        Returns: undefined
      }
      cancel_bet_with_fee: {
        Args: { p_order_id: string; p_user_id: string }
        Returns: {
          fee_amount: number
          message: string
          refund_amount: number
          success: boolean
        }[]
      }
      cleanup_expired_limit_orders: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_rate_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      close_expired_markets: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      detailed_balance_reconciliation: {
        Args: Record<PropertyKey, never>
        Returns: {
          source_type: string
          total_brl: number
          total_rioz: number
          transaction_count: number
        }[]
      }
      execute_limit_order_atomic: {
        Args: { p_current_price: number; p_order_id: string }
        Returns: {
          error_message: string
          new_brl_balance: number
          new_rioz_balance: number
          success: boolean
        }[]
      }
      execute_market_opinion_order: {
        Args: {
          p_market_id: string
          p_price: number
          p_quantity: number
          p_side: string
          p_user_id: string
        }
        Returns: {
          matched_quantity: number
          message: string
          new_order_id: string
          remaining_quantity: number
          success: boolean
        }[]
      }
      execute_market_order: {
        Args: {
          p_amount_input: number
          p_current_price: number
          p_input_currency: string
          p_side: string
          p_user_id: string
        }
        Returns: {
          amount_converted: number
          fee_charged: number
          message: string
          new_brl_balance: number
          new_rioz_balance: number
          success: boolean
        }[]
      }
      execute_pending_limit_orders: {
        Args: { p_current_price: number }
        Returns: {
          executed_count: number
          expired_count: number
          failed_count: number
        }[]
      }
      generate_orderbook_levels: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_market_pools: {
        Args: { market_id: string }
        Returns: {
          percent_nao: number
          percent_sim: number
          pool_nao: number
          pool_sim: number
          projected_fee: number
          total_pool: number
        }[]
      }
      get_market_stats: {
        Args: { target_market_id: string }
        Returns: {
          participantes: number
          vol_24h: number
          vol_total: number
        }[]
      }
      get_reconciliation_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          balances_brl: number
          balances_rioz: number
          brl_diff: number
          last_report_date: string
          ledger_brl: number
          ledger_rioz: number
          rioz_diff: number
        }[]
      }
      increment_balance: {
        Args: { amount: number; user_id: string }
        Returns: number
      }
      increment_brl_balance: {
        Args: { amount_centavos: number; user_id: string }
        Returns: undefined
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_price_fresh: {
        Args: { p_max_age_seconds?: number }
        Returns: {
          age_seconds: number
          current_price: number
          is_fresh: boolean
          last_update: string
        }[]
      }
      log_exchange_event: {
        Args: {
          p_correlation_id?: string
          p_event_data?: Json
          p_event_type: string
          p_user_id: string
        }
        Returns: string
      }
      update_market_stats: {
        Args: { target_market_id: string }
        Returns: undefined
      }
      update_rate_price: {
        Args: { p_price: number; p_symbol: string }
        Returns: undefined
      }
      validate_accounting_reconciliation: {
        Args: Record<PropertyKey, never>
        Returns: {
          brl_discrepancy: number
          is_reconciled: boolean
          last_check: string
          ledger_brl_net: number
          ledger_rioz_net: number
          rioz_discrepancy: number
          total_brl_balance: number
          total_rioz_balance: number
          total_users: number
        }[]
      }
      validate_exchange_reconciliation: {
        Args: Record<PropertyKey, never>
        Returns: {
          brl_discrepancy: number
          exchange_brl_net: number
          exchange_rioz_net: number
          is_reconciled: boolean
          last_check: string
          rioz_discrepancy: number
          total_brl_balance: number
          total_rioz_balance: number
          total_users: number
        }[]
      }
      validate_price_freshness: {
        Args: { p_max_age_seconds?: number }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
