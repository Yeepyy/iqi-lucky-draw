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

revoke all on function public.recalculate_prize_winner_counts() from public;
revoke all on function public.delete_participant(text) from public;
revoke all on function public.delete_all_participants() from public;
grant execute on function public.delete_participant(text) to authenticated;
grant execute on function public.delete_all_participants() to authenticated;
