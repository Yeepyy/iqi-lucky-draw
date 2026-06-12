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

create or replace function public.delete_all_participants()
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  delete from public.participants where id is not null;
  perform public.recalculate_prize_winner_counts();
end;
$$;
