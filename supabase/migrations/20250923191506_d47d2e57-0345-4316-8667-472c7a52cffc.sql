-- LIMPEZA COMPLETA DA TABELA CATEGORIES (VERSÃO CORRIGIDA)
-- Migração transacional para consolidar duplicatas, normalizar dados e garantir integridade

-- 1. CORREÇÃO DE REFERÊNCIAS EM MARKETS
-- Atualizar markets para apontar para categorias canônicas

UPDATE markets SET categoria = 'economia' WHERE categoria IN ('eco-1', 'Economia');
UPDATE markets SET categoria = 'esportes' WHERE categoria IN ('esp-1', 'Esportes');  
UPDATE markets SET categoria = 'politica' WHERE categoria IN ('pol-1', 'política', 'Política');
UPDATE markets SET categoria = 'tecnologia' WHERE categoria IN ('tec-1', 'Tecnologia');
UPDATE markets SET categoria = 'clima' WHERE categoria IN ('cli-1', 'Clima');
UPDATE markets SET categoria = 'entreten' WHERE categoria IN ('ent-1', 'entretenimento');
UPDATE markets SET categoria = 'cripto' WHERE categoria = 'Criptomoedas';

-- 2. ARQUIVAMENTO DE CATEGORIAS DUPLICADAS
-- Marcar duplicatas como inativas com sufixo de arquivamento

UPDATE categories SET 
  ativo = false,
  id = id || '__archived__' || substring(gen_random_uuid()::text, 1, 8),
  nome = nome || ' (Arquivada)'
WHERE id IN ('eco-1', 'esp-1', 'pol-1', 'tec-1', 'cli-1', 'ent-1');

-- 3. NORMALIZAÇÃO DE NOMES (Title Case consistente)
-- Aplicar capitalização padronizada nas categorias canônicas

UPDATE categories SET nome = 'Ciência' WHERE id = 'ciencia';
UPDATE categories SET nome = 'Cinema' WHERE id = 'cinema';
UPDATE categories SET nome = 'Clima' WHERE id = 'clima';
UPDATE categories SET nome = 'Cripto' WHERE id = 'cripto';
UPDATE categories SET nome = 'Cultura Pop' WHERE id = 'cultura';
UPDATE categories SET nome = 'Economia' WHERE id = 'economia';
UPDATE categories SET nome = 'Educação' WHERE id = 'educacao';
UPDATE categories SET nome = 'Entretenimento' WHERE id = 'entreten';
UPDATE categories SET nome = 'E-Sports' WHERE id = 'esports';
UPDATE categories SET nome = 'Esportes' WHERE id = 'esportes';
UPDATE categories SET nome = 'Games' WHERE id = 'games';
UPDATE categories SET nome = 'Música' WHERE id = 'musica';
UPDATE categories SET nome = 'Notícias' WHERE id = 'noticias';
UPDATE categories SET nome = 'Política' WHERE id = 'politica';
UPDATE categories SET nome = 'Tecnologia' WHERE id = 'tecnologia';

-- 4. REORDENAÇÃO SEQUENCIAL
-- Aplicar ordem sequencial em múltiplos de 10 para categorias ativas

UPDATE categories SET ordem = 0 WHERE id = 'ciencia' AND ativo = true;
UPDATE categories SET ordem = 10 WHERE id = 'cinema' AND ativo = true;
UPDATE categories SET ordem = 20 WHERE id = 'clima' AND ativo = true;
UPDATE categories SET ordem = 30 WHERE id = 'cripto' AND ativo = true;
UPDATE categories SET ordem = 40 WHERE id = 'cultura' AND ativo = true;
UPDATE categories SET ordem = 50 WHERE id = 'economia' AND ativo = true;
UPDATE categories SET ordem = 60 WHERE id = 'educacao' AND ativo = true;
UPDATE categories SET ordem = 70 WHERE id = 'entreten' AND ativo = true;
UPDATE categories SET ordem = 80 WHERE id = 'esports' AND ativo = true;
UPDATE categories SET ordem = 90 WHERE id = 'esportes' AND ativo = true;
UPDATE categories SET ordem = 100 WHERE id = 'games' AND ativo = true;
UPDATE categories SET ordem = 110 WHERE id = 'musica' AND ativo = true;
UPDATE categories SET ordem = 120 WHERE id = 'noticias' AND ativo = true;
UPDATE categories SET ordem = 130 WHERE id = 'politica' AND ativo = true;
UPDATE categories SET ordem = 140 WHERE id = 'tecnologia' AND ativo = true;

-- 5. CRIAÇÃO DE CONSTRAINTS DE INTEGRIDADE
-- Garantir unicidade de nomes ativos (case-insensitive)

CREATE UNIQUE INDEX IF NOT EXISTS categories_nome_unique_ci 
ON categories (LOWER(nome)) WHERE ativo = true;

-- Constraint para ordem não negativa (sintaxe corrigida)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_ordem_positive' 
    AND table_name = 'categories'
  ) THEN
    ALTER TABLE categories ADD CONSTRAINT check_ordem_positive CHECK (ordem >= 0);
  END IF;
END $$;