-- Sistema completo de Suporte e Pix Manual

-- Tabela de tickets de suporte
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'technical', 'financial', 'compliance')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  admin_notes TEXT
);

-- Tabela de mensagens dos tickets
CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de solicitações de Pix (depósito/saque)
CREATE TABLE public.fiat_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('deposit', 'withdrawal')),
  amount_brl NUMERIC NOT NULL CHECK (amount_brl > 0),
  pix_key TEXT,
  proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  admin_notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiat_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_tickets
CREATE POLICY "Users can view their own tickets"
ON public.support_tickets
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own tickets"
ON public.support_tickets
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all tickets"
ON public.support_tickets
FOR SELECT
USING (public.is_current_user_admin());

CREATE POLICY "Admins can update all tickets"
ON public.support_tickets
FOR UPDATE
USING (public.is_current_user_admin());

-- RLS Policies for ticket_messages
CREATE POLICY "Users can view messages from their tickets"
ON public.ticket_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE support_tickets.id = ticket_messages.ticket_id 
    AND support_tickets.user_id = auth.uid()
  ) OR public.is_current_user_admin()
);

CREATE POLICY "Users can create messages on their tickets"
ON public.ticket_messages
FOR INSERT
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.support_tickets 
    WHERE support_tickets.id = ticket_messages.ticket_id 
    AND support_tickets.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can create messages on any ticket"
ON public.ticket_messages
FOR INSERT
WITH CHECK (public.is_current_user_admin());

-- RLS Policies for fiat_requests
CREATE POLICY "Users can view their own fiat requests"
ON public.fiat_requests
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own fiat requests"
ON public.fiat_requests
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all fiat requests"
ON public.fiat_requests
FOR SELECT
USING (public.is_current_user_admin());

CREATE POLICY "Admins can update all fiat requests"
ON public.fiat_requests
FOR UPDATE
USING (public.is_current_user_admin());

-- Indexes for performance
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

CREATE INDEX idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_created_at ON public.ticket_messages(created_at DESC);

CREATE INDEX idx_fiat_requests_user_id ON public.fiat_requests(user_id);
CREATE INDEX idx_fiat_requests_status ON public.fiat_requests(status);
CREATE INDEX idx_fiat_requests_created_at ON public.fiat_requests(created_at DESC);

-- Triggers for updated_at
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fiat_requests_updated_at
  BEFORE UPDATE ON public.fiat_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();