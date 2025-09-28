-- Set default odds for markets that don't have them
UPDATE public.markets 
SET odds = CASE 
    WHEN opcoes->0 IS NOT NULL AND opcoes->1 IS NOT NULL THEN 
        jsonb_build_object(opcoes->>0, 2.0, opcoes->>1, 2.0)
    WHEN opcoes->0 IS NOT NULL AND opcoes->1 IS NOT NULL AND opcoes->2 IS NOT NULL THEN 
        jsonb_build_object(opcoes->>0, 1.8, opcoes->>1, 2.2, opcoes->>2, 3.0)
    ELSE jsonb_build_object('sim', 2.0, 'nao', 2.0)
END
WHERE odds = '{}' OR odds IS NULL;