insert into public.settings (key, value)
values ('wheelColors', '["#A8DADC", "#F4A6A6", "#CDB4DB", "#FFD6A5", "#BDE0FE", "#CDEAC0", "#FFCAD4", "#B8C0FF"]'::jsonb)
on conflict (key) do nothing;

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

drop policy if exists "public form settings read" on public.settings;
drop policy if exists "public client settings read" on public.settings;
create policy "public client settings read" on public.settings for select to anon, authenticated using (key in ('formFields', 'wheelColors'));

revoke all on function public.participant_duplicate_fields(text, text, text) from public;
grant execute on function public.participant_duplicate_fields(text, text, text) to anon, authenticated;

drop index if exists public.participants_ic_passport_unique;
create unique index participants_ic_passport_unique
  on public.participants ((regexp_replace(lower(ic_passport), '[^a-z0-9]', '', 'g')))
  where regexp_replace(lower(ic_passport), '[^a-z0-9]', '', 'g') <> '';
create unique index if not exists participants_email_normalized_unique
  on public.participants (lower(btrim(email)))
  where btrim(email) <> '';
create unique index if not exists participants_phone_normalized_unique
  on public.participants ((regexp_replace(phone_number, '[^0-9]', '', 'g')))
  where regexp_replace(phone_number, '[^0-9]', '', 'g') <> '';
