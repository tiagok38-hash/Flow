-- Habilitar a extensão para UUIDs se necessário
create extension if not exists "uuid-ossp";

-- 1. Tabela de Categorias
create table if not exists public.categorias (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  nome text not null,
  icone text not null default 'circle',
  ativa boolean default true,
  limite_mensal numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ativar RLS
alter table public.categorias enable row level security;

-- Política de acesso
create policy "Usuários podem ver apenas suas categorias"
on public.categorias for all
using (auth.uid() = user_id);

-- 2. Tabela de Cartões
create table if not exists public.cartoes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  nome text not null,
  final4 text,
  fechamento_dia integer not null check (fechamento_dia between 1 and 31),
  vencimento_dia integer not null check (vencimento_dia between 1 and 31),
  limite_mensal numeric,
  cor text default 'azul',
  bandeira text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ativar RLS
alter table public.cartoes enable row level security;

-- Política de acesso
create policy "Usuários podem ver apenas seus cartões"
on public.cartoes for all
using (auth.uid() = user_id);

-- 3. Tabela de Lançamentos
create table if not exists public.lancamentos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  tipo text not null check (tipo in ('receita', 'despesa')),
  descricao text not null,
  categoria_id uuid references public.categorias(id),
  valor numeric not null,
  data date not null,
  forma_pagamento text not null check (forma_pagamento in ('Dinheiro', 'Pix', 'Débito', 'Cartão')),
  cartao_id uuid references public.cartoes(id),
  status text not null default 'pago' check (status in ('pago', 'pendente')),
  competencia text,
  anexo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ativar RLS
alter table public.lancamentos enable row level security;

-- Política de acesso
create policy "Usuários podem ver apenas seus lançamentos"
on public.lancamentos for all
using (auth.uid() = user_id);

-- 4. Tabela de Preferências (Opcional, mas útil)
create table if not exists public.preferencias (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null unique,
  alerta_percentual_padrao numeric default 0.9,
  moeda_base text default 'BRL',
  timezone text default 'America/Sao_Paulo',
  resumo_semanal boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ativar RLS
alter table public.preferencias enable row level security;

-- Política de acesso
create policy "Usuários podem ver apenas suas preferências"
on public.preferencias for all
using (auth.uid() = user_id);

-- 5. Tabela de Lançamentos Fixos (Recorrentes)
create table if not exists public.lancamentos_fixos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null,
  nome text not null,
  categoria_id uuid references public.categorias(id),
  valor numeric not null,
  tipo text not null check (tipo in ('receita', 'despesa')),
  icone text default 'circle',
  periodicidade text not null check (periodicidade in ('diario', 'semanal', 'quinzenal', 'mensal')),
  dia_semana integer, -- 0 (Dom) a 6 (Sab)
  dia_mes_1 integer, -- 1 a 31
  dia_mes_2 integer, -- 1 a 31 (para quinzenal)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ativar RLS para lançamentos fixos
alter table public.lancamentos_fixos enable row level security;

-- Política de acesso para lançamentos fixos
create policy "Usuários podem ver apenas seus lançamentos fixos"
on public.lancamentos_fixos for all
using (auth.uid() = user_id);


-- Função para atualizar o updated_at automaticamente
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- Triggers
drop trigger if exists update_categorias_updated_at on public.categorias;
create trigger update_categorias_updated_at before update on public.categorias for each row execute procedure update_updated_at_column();

drop trigger if exists update_cartoes_updated_at on public.cartoes;
create trigger update_cartoes_updated_at before update on public.cartoes for each row execute procedure update_updated_at_column();

drop trigger if exists update_lancamentos_updated_at on public.lancamentos;
create trigger update_lancamentos_updated_at before update on public.lancamentos for each row execute procedure update_updated_at_column();

drop trigger if exists update_preferencias_updated_at on public.preferencias;
create trigger update_preferencias_updated_at before update on public.preferencias for each row execute procedure update_updated_at_column();

drop trigger if exists update_lancamentos_fixos_updated_at on public.lancamentos_fixos;
create trigger update_lancamentos_fixos_updated_at before update on public.lancamentos_fixos for each row execute procedure update_updated_at_column();


-- 6. Automação: Criar categorias padrão ao registrar novo usuário
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.categorias (user_id, nome, icone, ativa)
  values 
    (new.id, 'Alimentação', 'utensils', true),
    (new.id, 'Lazer', 'gamepad', true);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger disparado após inserção na tabela auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();


-- 7. Storage: Criar bucket para avatares
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Políticas de Storage (RLS)
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.uid() = owner );

create policy "Anyone can update their own avatar"
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.uid() = owner );

create policy "Anyone can delete their own avatar"
  on storage.objects for delete
  using ( bucket_id = 'avatars' and auth.uid() = owner );
