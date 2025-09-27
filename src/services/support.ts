import { supabase } from '@/integrations/supabase/client';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'general' | 'technical' | 'financial' | 'compliance';
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  admin_notes?: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

export interface CreateTicketRequest {
  subject: string;
  message: string;
  category: 'general' | 'technical' | 'financial' | 'compliance';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export const supportService = {
  async createTicket(data: CreateTicketRequest) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.access_token) {
      throw new Error('Not authenticated');
    }

    const response = await supabase.functions.invoke('create-support-ticket', {
      body: data,
      headers: {
        Authorization: `Bearer ${session.session.access_token}`,
      },
    });

    if (response.error) {
      throw new Error(response.error.message || 'Error creating ticket');
    }

    return response.data;
  },

  async getUserTickets(): Promise<SupportTicket[]> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []) as SupportTicket[];
  },

  async getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  async addTicketMessage(ticketId: string, message: string) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        user_id: session.session.user.id,
        message,
        is_admin: false
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  // Admin functions
  async getAllTickets(): Promise<SupportTicket[]> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []) as SupportTicket[];
  },

  async updateTicketStatus(ticketId: string, status: SupportTicket['status'], adminNotes?: string) {
    const { data, error } = await supabase
      .from('support_tickets')
      .update({
        status,
        admin_notes: adminNotes,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async addAdminMessage(ticketId: string, message: string) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        user_id: session.session.user.id,
        message,
        is_admin: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
};