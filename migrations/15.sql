
-- Corrigir problema de categorias duplicadas - limpar e recriar lógica
-- Não precisamos alterar estrutura, apenas fix lógico será no código

-- Adicionar constraint para evitar duplicatas de categorias por usuário
CREATE UNIQUE INDEX IF NOT EXISTS idx_categorias_user_nome ON categorias(user_id, nome) WHERE ativa = true;
