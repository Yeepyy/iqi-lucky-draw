'use client';

import { supabase } from '@/config/supabase';
import { DrawResult, Participant, Prize } from '@/types';
import { deletePrizeImage } from '@/lib/prizeImages';

type DbPrize = {
  id: string;
  name: string;
  probability: number;
  max_winners: number;
  current_winners: number;
  description: string | null;
  image_url: string | null;
  image_path: string | null;
};

type DbParticipant = {
  id: string;
  full_name: string;
  ic_passport: string;
  phone_number: string;
  email: string;
  project_name: string;
  unit_number: string;
  agent_name: string;
  created_at: string;
  has_spun: boolean;
};

type DbDrawResult = {
  id: string;
  participant_id: string;
  prize_id: string;
  prize_name: string;
  draw_date: string;
  reference_number: string;
  acknowledgement_signed: boolean;
  signature?: string | null;
};

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function mapPrize(prize: DbPrize): Prize {
  return {
    id: prize.id,
    name: prize.name,
    probability: Number(prize.probability),
    maxWinners: prize.max_winners,
    currentWinners: prize.current_winners,
    description: prize.description || '',
    imageUrl: prize.image_url || '',
    imagePath: prize.image_path || '',
  };
}

function prizeToDb(data: Partial<Prize>) {
  return {
    ...(data.name !== undefined && { name: data.name }),
    ...(data.probability !== undefined && { probability: data.probability }),
    ...(data.maxWinners !== undefined && { max_winners: data.maxWinners }),
    ...(data.currentWinners !== undefined && { current_winners: data.currentWinners }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.imageUrl !== undefined && { image_url: data.imageUrl }),
    ...(data.imagePath !== undefined && { image_path: data.imagePath }),
  };
}

function mapParticipant(participant: DbParticipant): Participant {
  return {
    id: participant.id,
    fullName: participant.full_name,
    icPassport: participant.ic_passport,
    phoneNumber: participant.phone_number,
    email: participant.email,
    projectName: participant.project_name,
    unitNumber: participant.unit_number,
    agentName: participant.agent_name,
    createdAt: new Date(participant.created_at),
    hasSpun: participant.has_spun,
  };
}

function participantToDb(data: Partial<Participant>) {
  return {
    ...(data.fullName !== undefined && { full_name: data.fullName }),
    ...(data.icPassport !== undefined && { ic_passport: data.icPassport }),
    ...(data.phoneNumber !== undefined && { phone_number: data.phoneNumber }),
    ...(data.email !== undefined && { email: data.email }),
    ...(data.projectName !== undefined && { project_name: data.projectName }),
    ...(data.unitNumber !== undefined && { unit_number: data.unitNumber }),
    ...(data.agentName !== undefined && { agent_name: data.agentName }),
    ...(data.hasSpun !== undefined && { has_spun: data.hasSpun }),
  };
}

function mapDrawResult(result: DbDrawResult): DrawResult {
  return {
    id: result.id,
    participantId: result.participant_id,
    prizeId: result.prize_id,
    prizeName: result.prize_name,
    drawDate: new Date(result.draw_date),
    referenceNumber: result.reference_number,
    acknowledgementSigned: result.acknowledgement_signed,
    signature: result.signature || undefined,
  };
}

export async function addParticipant(data: Omit<Participant, 'id' | 'createdAt' | 'hasSpun'>) {
  const { data: participant, error } = await supabase.rpc('register_participant', {
    p_full_name: data.fullName,
    p_ic_passport: data.icPassport,
    p_phone_number: data.phoneNumber,
    p_email: data.email,
    p_project_name: data.projectName,
    p_unit_number: data.unitNumber,
    p_agent_name: data.agentName,
  }).single();
  throwIfError(error);
  return mapParticipant(participant as DbParticipant);
}

export async function checkParticipantExists(icPassport: string, phoneNumber: string) {
  const { data, error } = await supabase.rpc('participant_exists', {
    p_ic_passport: icPassport,
    p_phone_number: phoneNumber,
  });
  throwIfError(error);
  return Boolean(data);
}

export async function getParticipantByIC(icPassport: string) {
  const { data, error } = await supabase.from('participants').select().eq('ic_passport', icPassport).maybeSingle();
  throwIfError(error);
  return data ? mapParticipant(data as DbParticipant) : null;
}

export async function getAllParticipants() {
  const { data, error } = await supabase.from('participants').select().order('created_at', { ascending: false });
  throwIfError(error);
  return (data as DbParticipant[]).map(mapParticipant);
}

export async function updateParticipant(id: string, data: Partial<Participant>) {
  const { error } = await supabase.from('participants').update(participantToDb(data)).eq('id', id);
  throwIfError(error);
}

export async function deleteParticipant(id: string) {
  const { error } = await supabase.from('participants').delete().eq('id', id);
  throwIfError(error);
}

export async function deleteAllParticipants() {
  const { error } = await supabase.from('participants').delete().not('id', 'is', null);
  throwIfError(error);
}

export async function addPrize(data: Omit<Prize, 'id' | 'currentWinners'>) {
  const { data: prize, error } = await supabase
    .from('prizes')
    .insert({ ...prizeToDb(data), current_winners: 0 })
    .select()
    .single();
  throwIfError(error);
  return mapPrize(prize as DbPrize);
}

export async function getAllPrizes() {
  const { data, error } = await supabase.from('prizes').select().order('created_at');
  throwIfError(error);
  return (data as DbPrize[]).map(mapPrize);
}

export async function updatePrize(prizeId: string, data: Partial<Prize>) {
  const { error } = await supabase.from('prizes').update(prizeToDb(data)).eq('id', prizeId);
  throwIfError(error);
}

export async function deletePrize(prizeId: string) {
  const { data, error } = await supabase.from('prizes').select('image_path').eq('id', prizeId).maybeSingle();
  throwIfError(error);
  const { error: deleteError } = await supabase.from('prizes').delete().eq('id', prizeId);
  throwIfError(deleteError);
  await deletePrizeImage(data?.image_path);
}

export async function savDrawResult(data: Omit<DrawResult, 'id' | 'drawDate' | 'referenceNumber' | 'acknowledgementSigned'>) {
  const referenceNumber = generateReferenceNumber();
  const { data: result, error } = await supabase.rpc('save_draw_result', {
    p_participant_id: data.participantId,
    p_prize_id: data.prizeId,
    p_prize_name: data.prizeName,
    p_reference_number: referenceNumber,
  }).single();
  throwIfError(error);
  return mapDrawResult(result as DbDrawResult);
}

export async function getDrawResultByParticipant(participantId: string) {
  const { data, error } = await supabase.from('draw_results').select().eq('participant_id', participantId).maybeSingle();
  throwIfError(error);
  return data ? mapDrawResult(data as DbDrawResult) : null;
}

export async function getAllDrawResults() {
  const { data, error } = await supabase.from('draw_results').select().order('draw_date', { ascending: false });
  throwIfError(error);
  return (data as DbDrawResult[]).map(mapDrawResult);
}

export async function deleteDrawResult(id: string) {
  const { error } = await supabase.rpc('delete_draw_result', { p_result_id: id });
  throwIfError(error);
}

export async function deleteAllDrawResults() {
  const { error } = await supabase.rpc('delete_all_draw_results');
  throwIfError(error);
}

export async function updateDrawResultSignature(drawResultId: string, signed: boolean, signature?: string) {
  const { error } = await supabase.rpc('sign_draw_result', {
    p_result_id: drawResultId,
    p_signed: signed,
    p_signature: signature || null,
  });
  throwIfError(error);
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const { data, error } = await supabase.from('settings').select('value').eq('key', key).maybeSingle();
  throwIfError(error);
  return data ? data.value as T : fallback;
}

export async function saveSetting<T>(key: string, value: T) {
  const { error } = await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' });
  throwIfError(error);
}

export function generateReferenceNumber(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `LD-${year}-${randomNum}`;
}

export async function selectWinningPrize(prizes: Prize[]): Promise<Prize | null> {
  const availablePrizes = prizes.filter((p) => p.currentWinners < p.maxWinners);
  if (!availablePrizes.length) return null;

  const totalProbability = availablePrizes.reduce((sum, p) => sum + p.probability, 0);
  if (!totalProbability) return availablePrizes[0];

  let random = Math.random() * totalProbability;
  for (const prize of availablePrizes) {
    random -= prize.probability;
    if (random <= 0) return prize;
  }
  return availablePrizes[0];
}
