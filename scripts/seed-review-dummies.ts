import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomInt } from 'node:crypto';
import { resolve } from 'node:path';
import { config } from 'dotenv';

import {
  getSeedReviewTargetCount,
  randomReviewCreatedAt,
  randomSeedRating,
} from './review-seed-popularity';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다.');
  process.exit(1);
}

const SEED_EMAIL_DOMAIN = 'review-seed.freehub.local';
const POOL_SIZE = 320;

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Avery',
  'Quinn', 'Blake', 'Cameron', 'Drew', 'Elliot', 'Harper', 'Jesse', 'Kai',
  'Logan', 'Noah', 'Owen', 'Parker', 'Reese', 'Sage', 'Skyler', 'Tyler',
  'Chris', 'David', 'Emma', 'Grace', 'Henry', 'Isaac', 'Jack', 'Kate',
  'Liam', 'Mia', 'Nate', 'Olivia', 'Paul', 'Ryan', 'Sam', 'Zoe',
];

const LAST_PARTS = [
  'Dev', 'Tech', 'Coder', 'Maker', 'Labs', 'Studio', 'Works', 'Hub',
  'Pro', 'Fan', 'User', 'Geek', 'Ninja', 'Guru', 'Wave', 'Byte',
];

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function pick<T>(items: T[]): T {
  return items[randomInt(items.length)]!;
}

function generateNickname(used: Set<string>): string {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const first = pick(FIRST_NAMES);
    const suffix = randomInt(4) === 0 ? '' : pick(LAST_PARTS);
    const number = randomInt(4) === 0 ? String(randomInt(10, 99)) : '';
    const separator = suffix && number ? '_' : suffix || number ? '_' : '';
    const nickname = `${first}${separator}${suffix}${number}`.slice(0, 20);

    if (nickname.length >= 2 && !used.has(nickname.toLowerCase())) {
      used.add(nickname.toLowerCase());
      return nickname;
    }
  }

  const fallback = `User${randomInt(10000, 99999)}`;
  used.add(fallback.toLowerCase());
  return fallback;
}

async function listSeedUserIds(supabase: SupabaseClient): Promise<string[]> {
  const ids: string[] = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);

    for (const user of data.users) {
      if (user.email?.endsWith(`@${SEED_EMAIL_DOMAIN}`)) {
        ids.push(user.id);
      }
    }

    if (data.users.length < perPage) break;
    page += 1;
  }

  return ids;
}

async function ensureSeedUserPool(
  supabase: SupabaseClient,
): Promise<{ userIds: string[]; createdUsers: number; createdProfiles: number }> {
  const existingIds = await listSeedUserIds(supabase);
  const usedNicknames = new Set<string>();

  if (existingIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('nickname')
      .in('user_id', existingIds);

    for (const row of profiles ?? []) {
      usedNicknames.add(String(row.nickname).toLowerCase());
    }
  }

  const userIds = [...existingIds];
  let createdUsers = 0;
  let createdProfiles = 0;

  while (userIds.length < POOL_SIZE) {
    const index = userIds.length + 1;
    const email = `seed${String(index).padStart(4, '0')}@${SEED_EMAIL_DOMAIN}`;
    const nickname = generateNickname(usedNicknames);
    const password = `Seed!${randomInt(100000, 999999)}Aa`;

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nickname, is_review_seed: true },
    });

    if (error) {
      throw new Error(`사용자 생성 실패 (${email}): ${error.message}`);
    }

    const userId = data.user.id;
    userIds.push(userId);
    createdUsers += 1;

    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        user_id: userId,
        nickname,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    if (profileError) {
      throw new Error(`프로필 생성 실패 (${nickname}): ${profileError.message}`);
    }

    createdProfiles += 1;
  }

  return { userIds, createdUsers, createdProfiles };
}

async function deleteSeedReviews(
  supabase: SupabaseClient,
  seedUserIds: string[],
): Promise<number> {
  if (seedUserIds.length === 0) return 0;

  const { data, error } = await supabase
    .from('tool_reviews')
    .delete()
    .in('user_id', seedUserIds)
    .select('id');

  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

async function reshuffleSeedReviewDates(
  supabase: SupabaseClient,
  seedUserIds: string[],
): Promise<number> {
  if (seedUserIds.length === 0) return 0;

  const { data, error } = await supabase
    .from('tool_reviews')
    .select('id')
    .in('user_id', seedUserIds);

  if (error) throw new Error(error.message);

  const reviewIds = (data ?? []).map((row) => row.id as string);
  if (reviewIds.length === 0) return 0;

  const chunkSize = 50;
  let updated = 0;

  for (let i = 0; i < reviewIds.length; i += chunkSize) {
    const chunk = reviewIds.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (id) => {
        const createdAt = randomReviewCreatedAt();
        const { error: updateError } = await supabase
          .from('tool_reviews')
          .update({ created_at: createdAt, updated_at: createdAt })
          .eq('id', id);

        if (updateError) throw new Error(updateError.message);
        updated += 1;
      }),
    );
  }

  return updated;
}

async function main() {
  const datesOnly = process.argv.includes('--dates-only');
  const supabase = createClient(supabaseUrl!, serviceKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: tools, error: toolsError } = await supabase
    .from('tools')
    .select('id, name, slug')
    .order('name');

  if (toolsError) throw new Error(toolsError.message);
  if (!tools?.length) {
    console.log('등록된 서비스가 없습니다.');
    return;
  }

  console.log(`서비스 ${tools.length}개 확인`);

  const { userIds, createdUsers, createdProfiles } = await ensureSeedUserPool(supabase);
  console.log(
    `시드 사용자 풀: ${userIds.length}명 (신규 사용자 ${createdUsers}, 프로필 ${createdProfiles})`,
  );

  if (datesOnly) {
    const updated = await reshuffleSeedReviewDates(supabase, userIds);
    const year = new Date().getFullYear();
    console.log(
      `완료 — 시드 리뷰 ${updated}건 작성일을 ${year}년 6월 1일 ~ 오늘 사이로 갱신`,
    );
    return;
  }

  const deleted = await deleteSeedReviews(supabase, userIds);
  console.log(`기존 시드 리뷰 ${deleted}건 삭제`);

  let insertedReviews = 0;
  let zeroReviewTools = 0;
  const shuffledUsers = shuffle(userIds);
  let userCursor = 0;

  const pickUsers = (count: number): string[] => {
    const picked: string[] = [];
    for (let i = 0; i < count; i += 1) {
      picked.push(shuffledUsers[userCursor % shuffledUsers.length]!);
      userCursor += 1;
    }
    return picked;
  };

  for (const tool of tools) {
    const toolId = tool.id as string;
    const slug = tool.slug as string;
    const targetCount = getSeedReviewTargetCount(slug);

    if (targetCount === 0) {
      zeroReviewTools += 1;
      console.log(`  · ${tool.name}: 0건`);
      continue;
    }

    const candidates = pickUsers(targetCount);
    const rows = candidates.map((userId) => ({
      tool_id: toolId,
      user_id: userId,
      rating: randomSeedRating(),
      content: '',
      created_at: randomReviewCreatedAt(),
      updated_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase.from('tool_reviews').insert(rows);
    if (insertError) {
      throw new Error(`${slug}: ${insertError.message}`);
    }

    insertedReviews += rows.length;
    console.log(`  + ${tool.name}: ${rows.length}건`);
  }

  console.log('');
  console.log(
    `완료 — 리뷰 ${insertedReviews}건 생성, 리뷰 없음 ${zeroReviewTools}개 서비스`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
