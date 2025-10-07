-- Add ticket_numbers column to raffle_entries
ALTER TABLE public.raffle_entries 
ADD COLUMN IF NOT EXISTS ticket_numbers INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- Create function to generate unique random ticket numbers
CREATE OR REPLACE FUNCTION public.generate_raffle_ticket_numbers(
  p_raffle_id UUID,
  p_quantity INTEGER
)
RETURNS INTEGER[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing_tickets INTEGER[];
  _new_tickets INTEGER[];
  _random_number INTEGER;
  _max_ticket INTEGER := 999999;
  _i INTEGER;
BEGIN
  -- Get all existing ticket numbers for this raffle
  SELECT COALESCE(ARRAY_AGG(ticket_num), ARRAY[]::INTEGER[])
  INTO _existing_tickets
  FROM (
    SELECT UNNEST(ticket_numbers) as ticket_num
    FROM raffle_entries
    WHERE raffle_id = p_raffle_id
  ) t;
  
  -- Generate unique random numbers
  _new_tickets := ARRAY[]::INTEGER[];
  _i := 0;
  
  WHILE _i < p_quantity LOOP
    _random_number := floor(random() * _max_ticket + 1)::INTEGER;
    
    -- Check if number is unique
    IF NOT (_random_number = ANY(_existing_tickets)) AND 
       NOT (_random_number = ANY(_new_tickets)) THEN
      _new_tickets := array_append(_new_tickets, _random_number);
      _i := _i + 1;
    END IF;
  END LOOP;
  
  RETURN _new_tickets;
END;
$$;