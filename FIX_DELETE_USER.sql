-- Script corrigido (sem a tabela preferencias que não existe)

-- 1. Categorias: Permitir deletar usuário apagando suas categorias em cascata
ALTER TABLE public.categorias
DROP CONSTRAINT IF EXISTS categorias_user_id_fkey, -- Nome padrão provável
DROP CONSTRAINT IF EXISTS categorias_user_id_fkey1; -- Caso tenha outro nome

ALTER TABLE public.categorias
ADD CONSTRAINT categorias_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 2. Cartões
ALTER TABLE public.cartoes
DROP CONSTRAINT IF EXISTS cartoes_user_id_fkey;

ALTER TABLE public.cartoes
ADD CONSTRAINT cartoes_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 3. Lançamentos
ALTER TABLE public.lancamentos
DROP CONSTRAINT IF EXISTS lancamentos_user_id_fkey;

ALTER TABLE public.lancamentos
ADD CONSTRAINT lancamentos_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 5. Lançamentos Fixos
ALTER TABLE public.lancamentos_fixos
DROP CONSTRAINT IF EXISTS lancamentos_fixos_user_id_fkey;

ALTER TABLE public.lancamentos_fixos
ADD CONSTRAINT lancamentos_fixos_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;
