-- =====================================================================
-- Uprawnienia w bazie (Supabase → SQL Editor → wklej całość → Run)
--
--   Pracownik (zatwierdzony): dodaje zlecenia, zmienia status/drukarkę/priorytet,
--                             usuwa zlecenia (kolejka i historia), pobiera pliki.
--   Administrator:            wszystko to + panel admina (pracownicy, stawka,
--                             filamenty, drukarki).
--
-- Skrypt można uruchamiać wielokrotnie. Polityki RLS się sumują (OR), więc
-- jeśli w Authentication → Policies masz własne, starsze polityki dla tych
-- tabel, które dają pracownikom więcej niż poniżej, usuń je.
-- =====================================================================

-- ---------- funkcje pomocnicze (security definer = bez rekurencji RLS) ----------
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_approved_user()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (role = 'admin' or is_approved = true)
  );
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_approved_user() to authenticated;

-- ---------- orders: zatwierdzeni użytkownicy robią wszystko ----------
alter table public.orders enable row level security;

drop policy if exists "orders_select_approved" on public.orders;
drop policy if exists "orders_insert_approved" on public.orders;
drop policy if exists "orders_update_approved" on public.orders;
drop policy if exists "orders_delete_approved" on public.orders;
drop policy if exists "Admins can delete orders" on public.orders;

create policy "orders_select_approved" on public.orders
  for select to authenticated using (public.is_approved_user());
create policy "orders_insert_approved" on public.orders
  for insert to authenticated
  with check (public.is_approved_user() and user_id = auth.uid());
create policy "orders_update_approved" on public.orders
  for update to authenticated
  using (public.is_approved_user()) with check (public.is_approved_user());
create policy "orders_delete_approved" on public.orders
  for delete to authenticated using (public.is_approved_user());

-- ---------- filamenty, drukarki, ustawienia (stawka za godzinę): odczyt dla zatwierdzonych, zapis tylko admin ----------
do $$
declare t text;
begin
  foreach t in array array['filaments', 'printers', 'settings'] loop
    if to_regclass('public.' || t) is null then
      raise notice 'Pomijam tabelę public.% (nie istnieje)', t;
      continue;
    end if;

    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t || '_select_approved', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert_admin', t);
    execute format('drop policy if exists %I on public.%I', t || '_update_admin', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete_admin', t);

    execute format('create policy %I on public.%I for select to authenticated using (public.is_approved_user())', t || '_select_approved', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_admin())', t || '_insert_admin', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t || '_update_admin', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_admin())', t || '_delete_admin', t);
  end loop;
end $$;

-- ---------- profiles: każdy widzi swój profil, admin widzi i zarządza wszystkimi ----------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "profiles_delete_admin" on public.profiles;

create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles_update_admin" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "profiles_delete_admin" on public.profiles
  for delete to authenticated using (public.is_admin());

-- ---------- storage (bucket order-files): dodawanie, pobieranie i usuwanie plików ----------
drop policy if exists "order_files_select_approved" on storage.objects;
drop policy if exists "order_files_insert_approved" on storage.objects;
drop policy if exists "order_files_delete_approved" on storage.objects;

create policy "order_files_select_approved" on storage.objects
  for select to authenticated
  using (bucket_id = 'order-files' and public.is_approved_user());
create policy "order_files_insert_approved" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'order-files' and public.is_approved_user());
create policy "order_files_delete_approved" on storage.objects
  for delete to authenticated
  using (bucket_id = 'order-files' and public.is_approved_user());
