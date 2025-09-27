import { supabase } from '@/integrations/supabase/client';

export interface FiatRequest {
  id: string;
  user_id: string;
  request_type: 'deposit' | 'withdrawal';
  amount_brl: number;
  pix_key?: string;
  proof_url?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  admin_notes?: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFiatRequestData {
  request_type: 'deposit' | 'withdrawal';
  amount_brl: number;
  pix_key?: string;
  proof_url?: string;
}

export const fiatService = {
  async createFiatRequest(data: CreateFiatRequestData) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.access_token) {
      throw new Error('Not authenticated');
    }

    const response = await supabase.functions.invoke('process-fiat-request/create', {
      body: data,
      headers: {
        Authorization: `Bearer ${session.session.access_token}`,
      },
    });

    if (response.error) {
      throw new Error(response.error.message || 'Error creating fiat request');
    }

    return response.data;
  },

  async getUserFiatRequests(): Promise<FiatRequest[]> {
    const { data, error } = await supabase
      .from('fiat_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []) as FiatRequest[];
  },

  // Admin functions
  async getAllFiatRequests(): Promise<FiatRequest[]> {
    const { data, error } = await supabase
      .from('fiat_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []) as FiatRequest[];
  },

  async processFiatRequest(requestId: string, status: 'approved' | 'rejected', adminNotes?: string) {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.access_token) {
      throw new Error('Not authenticated');
    }

    const response = await supabase.functions.invoke('process-fiat-request/process', {
      body: {
        request_id: requestId,
        status,
        admin_notes: adminNotes
      },
      headers: {
        Authorization: `Bearer ${session.session.access_token}`,
      },
    });

    if (response.error) {
      throw new Error(response.error.message || 'Error processing fiat request');
    }

    return response.data;
  },

  // Storage functions for proof upload
  async uploadProof(file: File, userId: string): Promise<string> {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExtension}`;

    const { data, error } = await supabase.storage
      .from('fiat-proofs')
      .upload(fileName, file);

    if (error) {
      throw new Error(error.message);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('fiat-proofs')
      .getPublicUrl(data.path);

    return publicUrl;
  }
};