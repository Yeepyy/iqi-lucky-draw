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

create unique index if not exists participants_ic_passport_unique
  on public.participants ((regexp_replace(lower(ic_passport), '[^a-z0-9]', '', 'g')))
  where regexp_replace(lower(ic_passport), '[^a-z0-9]', '', 'g') <> '';
create unique index if not exists participants_email_normalized_unique on public.participants (lower(btrim(email))) where btrim(email) <> '';
create unique index if not exists participants_phone_normalized_unique on public.participants ((regexp_replace(phone_number, '[^0-9]', '', 'g'))) where regexp_replace(phone_number, '[^0-9]', '', 'g') <> '';

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

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'participants') then
    alter publication supabase_realtime add table public.participants;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'prizes') then
    alter publication supabase_realtime add table public.prizes;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'draw_results') then
    alter publication supabase_realtime add table public.draw_results;
  end if;
end $$;

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

insert into public.settings (key, value)
values ('wheelColors', '["#A8DADC", "#F4A6A6", "#CDB4DB", "#FFD6A5", "#BDE0FE", "#CDEAC0", "#FFCAD4", "#B8C0FF"]'::jsonb)
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

create or replace function public.participant_duplicate_fields(p_ic_passport text, p_email text, p_phone_number text)
returns text[] language sql stable security definer set search_path = public as $$
  select array_remove(array[
    case when regexp_replace(lower(coalesce(p_ic_passport, '')), '[^a-z0-9]', '', 'g') <> ''
      and exists (
        select 1 from public.participants
        where regexp_replace(lower(ic_passport), '[^a-z0-9]', '', 'g') =
          regexp_replace(lower(p_ic_passport), '[^a-z0-9]', '', 'g')
      ) then 'IC / Passport' end,
    case when btrim(coalesce(p_email, '')) <> ''
      and exists (
        select 1 from public.participants
        where lower(btrim(email)) = lower(btrim(p_email))
      ) then 'Email Address' end,
    case when regexp_replace(coalesce(p_phone_number, ''), '[^0-9]', '', 'g') <> ''
      and exists (
        select 1 from public.participants
        where regexp_replace(phone_number, '[^0-9]', '', 'g') =
          regexp_replace(p_phone_number, '[^0-9]', '', 'g')
      ) then 'Phone Number' end
  ], null);
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
declare duplicate_fields text[];
begin
  duplicate_fields := public.participant_duplicate_fields(p_ic_passport, p_email, p_phone_number);
  if cardinality(duplicate_fields) > 0 then
    raise exception '% already registered. Please contact your Agent.', array_to_string(duplicate_fields, ', ');
  end if;
  insert into public.participants (full_name, ic_passport, phone_number, email, project_name, unit_number, agent_name)
  values (btrim(p_full_name), btrim(p_ic_passport), btrim(p_phone_number), lower(btrim(p_email)), btrim(p_project_name), btrim(p_unit_number), btrim(p_agent_name))
  returning * into result;
  return result;
exception
  when unique_violation then
    duplicate_fields := public.participant_duplicate_fields(p_ic_passport, p_email, p_phone_number);
    raise exception '% already registered. Please contact your Agent.', array_to_string(duplicate_fields, ', ');
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
  delete from public.draw_results where id is not null;
  update public.prizes set current_winners = 0 where id is not null;
  update public.participants set has_spun = false where id is not null;
end;
$$;

create or replace function public.recalculate_prize_winner_counts()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.prizes prize
  set current_winners = (
    select count(*)::integer
    from public.draw_results result
    where result.prize_id = prize.id
  )
  where prize.id is not null;
end;
$$;

create or replace function public.delete_participant(p_participant_id text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  delete from public.participants where id = p_participant_id;
  perform public.recalculate_prize_winner_counts();
end;
$$;

create or replace function public.delete_all_participants()
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  delete from public.participants where id is not null;
  perform public.recalculate_prize_winner_counts();
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
drop policy if exists "public client settings read" on public.settings;
create policy "public client settings read" on public.settings for select to anon, authenticated using (key in ('formFields', 'wheelColors'));
drop policy if exists "admin settings write" on public.settings;
create policy "admin settings write" on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin users read" on public.admin_users;
create policy "admin users read" on public.admin_users for select to authenticated using (user_id = auth.uid());

revoke all on function public.is_admin() from public;
revoke all on function public.participant_exists(text, text) from public;
revoke all on function public.participant_duplicate_fields(text, text, text) from public;
revoke all on function public.register_participant(text, text, text, text, text, text, text) from public;
revoke all on function public.save_draw_result(text, text, text, text) from public;
revoke all on function public.sign_draw_result(text, boolean, text) from public;
revoke all on function public.delete_draw_result(text) from public;
revoke all on function public.delete_all_draw_results() from public;
revoke all on function public.recalculate_prize_winner_counts() from public;
revoke all on function public.delete_participant(text) from public;
revoke all on function public.delete_all_participants() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.participant_exists(text, text) to anon, authenticated;
grant execute on function public.participant_duplicate_fields(text, text, text) to anon, authenticated;
grant execute on function public.register_participant(text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.save_draw_result(text, text, text, text) to anon, authenticated;
grant execute on function public.sign_draw_result(text, boolean, text) to anon, authenticated;
grant execute on function public.delete_draw_result(text) to authenticated;
grant execute on function public.delete_all_draw_results() to authenticated;
grant execute on function public.delete_participant(text) to authenticated;
grant execute on function public.delete_all_participants() to authenticated;

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
