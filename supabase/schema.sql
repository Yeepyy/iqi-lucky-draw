create extension if not exists pgcrypto;

create table if not exists public.participants (
  id text primary key default gen_random_uuid()::text,
  full_name text not null,
  ic_passport text not null default '',
  phone_number text not null default '',
  email text not null default '',
  project_name text not null default '',
  unit_number text not null default '',
  agent_name text not null default '',
  created_at timestamptz not null default now(),
  has_spun boolean not null default false
);

create unique index if not exists participants_ic_passport_unique on public.participants (ic_passport) where ic_passport <> '';

create table if not exists public.prizes (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  probability numeric not null default 0 check (probability >= 0),
  max_winners integer not null default 1 check (max_winners > 0),
  current_winners integer not null default 0 check (current_winners >= 0),
  description text,
  image_url text,
  image_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.draw_results (
  id text primary key default gen_random_uuid()::text,
  participant_id text not null references public.participants(id) on delete cascade,
  prize_id text not null references public.prizes(id) on delete cascade,
  prize_name text not null,
  draw_date timestamptz not null default now(),
  reference_number text not null unique,
  acknowledgement_signed boolean not null default false,
  signature text
);

drop index if exists public.draw_results_participant_unique;
create index if not exists draw_results_participant_index on public.draw_results (participant_id);

create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.settings (key, value)
values ('formFields', jsonb_build_object(
  'showIC', true,
  'showPhone', true,
  'showEmail', true,
  'showProject', true,
  'showUnit', true,
  'showAgent', true
))
on conflict (key) do nothing;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.participant_exists(p_ic_passport text, p_phone_number text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.participants
    where (p_ic_passport <> '' and ic_passport = p_ic_passport)
       or (p_phone_number <> '' and phone_number = p_phone_number)
  );
$$;

create or replace function public.register_participant(
  p_full_name text,
  p_ic_passport text,
  p_phone_number text,
  p_email text,
  p_project_name text,
  p_unit_number text,
  p_agent_name text
)
returns public.participants language plpgsql security definer set search_path = public as $$
declare result public.participants;
begin
  if public.participant_exists(p_ic_passport, p_phone_number) then
    raise exception 'You have already participated in this lucky draw';
  end if;
  insert into public.participants (full_name, ic_passport, phone_number, email, project_name, unit_number, agent_name)
  values (p_full_name, p_ic_passport, p_phone_number, p_email, p_project_name, p_unit_number, p_agent_name)
  returning * into result;
  return result;
end;
$$;

create or replace function public.save_draw_result(p_participant_id text, p_prize_id text, p_prize_name text, p_reference_number text)
returns public.draw_results language plpgsql security definer set search_path = public as $$
declare result public.draw_results;
declare selected_prize_name text;
begin
  if exists (select 1 from public.participants where id = p_participant_id and has_spun) then
    raise exception 'Participant has already spun';
  end if;
  update public.prizes set current_winners = current_winners + 1
    where id = p_prize_id and current_winners < max_winners;
  if not found then raise exception 'Prize is no longer available'; end if;
  select name into selected_prize_name from public.prizes where id = p_prize_id;
  update public.participants set has_spun = true where id = p_participant_id;
  insert into public.draw_results (participant_id, prize_id, prize_name, reference_number)
    values (p_participant_id, p_prize_id, selected_prize_name, p_reference_number) returning * into result;
  return result;
end;
$$;

create or replace function public.delete_draw_result(p_result_id text)
returns void language plpgsql security definer set search_path = public as $$
declare result_prize_id text;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  delete from public.draw_results where id = p_result_id returning prize_id into result_prize_id;
  if result_prize_id is not null then
    update public.prizes set current_winners = greatest(0, current_winners - 1) where id = result_prize_id;
  end if;
end;
$$;

create or replace function public.sign_draw_result(p_result_id text, p_signed boolean, p_signature text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.draw_results
  set acknowledgement_signed = p_signed, signature = p_signature
  where id = p_result_id;
end;
$$;

create or replace function public.delete_all_draw_results()
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  delete from public.draw_results;
  update public.prizes set current_winners = 0;
  update public.participants set has_spun = false;
end;
$$;

alter table public.participants enable row level security;
alter table public.prizes enable row level security;
alter table public.draw_results enable row level security;
alter table public.settings enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "public participants access" on public.participants;
drop policy if exists "admin participants access" on public.participants;
create policy "admin participants access" on public.participants for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public prizes access" on public.prizes;
drop policy if exists "public prizes read" on public.prizes;
create policy "public prizes read" on public.prizes for select to anon, authenticated using (true);
drop policy if exists "admin prizes write" on public.prizes;
create policy "admin prizes write" on public.prizes for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public draw results access" on public.draw_results;
drop policy if exists "admin draw results access" on public.draw_results;
create policy "admin draw results access" on public.draw_results for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public settings access" on public.settings;
drop policy if exists "public form settings read" on public.settings;
create policy "public form settings read" on public.settings for select to anon, authenticated using (key = 'formFields');
drop policy if exists "admin settings write" on public.settings;
create policy "admin settings write" on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin users read" on public.admin_users;
create policy "admin users read" on public.admin_users for select to authenticated using (user_id = auth.uid());

revoke all on function public.is_admin() from public;
revoke all on function public.participant_exists(text, text) from public;
revoke all on function public.register_participant(text, text, text, text, text, text, text) from public;
revoke all on function public.save_draw_result(text, text, text, text) from public;
revoke all on function public.sign_draw_result(text, boolean, text) from public;
revoke all on function public.delete_draw_result(text) from public;
revoke all on function public.delete_all_draw_results() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.participant_exists(text, text) to anon, authenticated;
grant execute on function public.register_participant(text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.save_draw_result(text, text, text, text) to anon, authenticated;
grant execute on function public.sign_draw_result(text, boolean, text) to anon, authenticated;
grant execute on function public.delete_draw_result(text) to authenticated;
grant execute on function public.delete_all_draw_results() to authenticated;

insert into storage.buckets (id, name, public) values ('prize-images', 'prize-images', true)
on conflict (id) do update set public = true;

drop policy if exists "public prize image read" on storage.objects;
create policy "public prize image read" on storage.objects for select to public using (bucket_id = 'prize-images');
drop policy if exists "public prize image insert" on storage.objects;
drop policy if exists "admin prize image insert" on storage.objects;
create policy "admin prize image insert" on storage.objects for insert to authenticated with check (bucket_id = 'prize-images' and public.is_admin());
drop policy if exists "public prize image update" on storage.objects;
drop policy if exists "admin prize image update" on storage.objects;
create policy "admin prize image update" on storage.objects for update to authenticated using (bucket_id = 'prize-images' and public.is_admin());
drop policy if exists "public prize image delete" on storage.objects;
drop policy if exists "admin prize image delete" on storage.objects;
create policy "admin prize image delete" on storage.objects for delete to authenticated using (bucket_id = 'prize-images' and public.is_admin());
