import { createClient } from '@supabase/supabase-js';

const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!firebaseProjectId || !firebaseApiKey || !supabaseUrl || !supabaseKey) {
  throw new Error('Missing Firebase project/API key, Supabase URL, or Supabase anon/service-role key.');
}

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

function decodeValue(value = {}) {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
  return null;
}

function decodeFields(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

async function readCollection(collection) {
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/${collection}?pageSize=1000&key=${firebaseApiKey}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to read Firebase ${collection}: ${response.status} ${await response.text()}`);
  const body = await response.json();
  return (body.documents || []).map((document) => ({
    id: document.name.split('/').pop(),
    ...decodeFields(document.fields),
  }));
}

function participantRow(row) {
  return {
    id: row.id,
    full_name: row.fullName || '',
    ic_passport: row.icPassport || '',
    phone_number: row.phoneNumber || '',
    email: row.email || '',
    project_name: row.projectName || '',
    unit_number: row.unitNumber || '',
    agent_name: row.agentName || '',
    created_at: row.createdAt || new Date().toISOString(),
    has_spun: Boolean(row.hasSpun),
  };
}

function prizeRow(row) {
  return {
    id: row.id,
    name: row.name,
    probability: Number(row.probability || 0),
    max_winners: Number(row.maxWinners || 1),
    current_winners: Number(row.currentWinners || 0),
    description: row.description || '',
    image_url: row.imageUrl || '',
    image_path: row.imagePath || '',
  };
}

function drawResultRow(row) {
  return {
    id: row.id,
    participant_id: row.participantId,
    prize_id: row.prizeId,
    prize_name: row.prizeName,
    draw_date: row.drawDate || new Date().toISOString(),
    reference_number: row.referenceNumber,
    acknowledgement_signed: Boolean(row.acknowledgementSigned),
    signature: row.signature || null,
  };
}

async function upsert(table, rows) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
  if (error) throw error;
  console.log(`Migrated ${rows.length} ${table}`);
}

const [participants, prizes, drawResults, settings] = await Promise.all([
  readCollection('participants'),
  readCollection('prizes'),
  readCollection('drawResults'),
  readCollection('settings'),
]);

await upsert('participants', participants.map(participantRow));
await upsert('prizes', prizes.map(prizeRow));
await upsert('draw_results', drawResults.map(drawResultRow));

if (settings.length) {
  const { error } = await supabase.from('settings').upsert(
    settings.map(({ id, ...value }) => ({ key: id, value })),
    { onConflict: 'key' }
  );
  if (error) throw error;
  console.log(`Migrated ${settings.length} settings`);
}
