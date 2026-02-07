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
