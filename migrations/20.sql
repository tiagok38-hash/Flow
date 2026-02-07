-- 7. Storage: Criar bucket para avatares
-- Nota: Isso requer que a extensão 'storage' esteja habilitada no Supabase (padrão)

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Políticas de Storage (RLS)
-- Permitir leitura pública
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

-- Permitir upload apenas para o próprio usuário (baseado no owner)
create policy "Anyone can upload an avatar"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.uid() = owner );

-- Permitir update apenas para o próprio usuário
create policy "Anyone can update their own avatar"
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.uid() = owner );

-- Permitir delete apenas para o próprio usuário
create policy "Anyone can delete their own avatar"
  on storage.objects for delete
  using ( bucket_id = 'avatars' and auth.uid() = owner );
