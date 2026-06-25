import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { randomInt } from 'node:crypto';
import { resolve } from 'node:path';
import { config } from 'dotenv';

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

function randomPastDate(daysBack = 180): string {
  const now = Date.now();
  const offsetMs = randomInt(0, daysBack * 24 * 60 * 60 * 1000);
  return new Date(now - offsetMs).toISOString();
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

async function main() {
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

  let insertedReviews = 0;
  let skippedTools = 0;

  for (const tool of tools) {
    const toolId = tool.id as string;
    const targetCount = randomInt(1, 13);

    const { count: existingCount, error: countError } = await supabase
      .from('tool_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('tool_id', toolId)
      .in('user_id', userIds);

    if (countError) throw new Error(countError.message);

    if ((existingCount ?? 0) >= targetCount) {
      skippedTools += 1;
      continue;
    }

    const need = targetCount - (existingCount ?? 0);

    const { data: existingReviews } = await supabase
      .from('tool_reviews')
      .select('user_id')
      .eq('tool_id', toolId);

    const usedOnTool = new Set(
      (existingReviews ?? []).map((row) => row.user_id as string),
    );

    const candidates = shuffle(userIds.filter((id) => !usedOnTool.has(id))).slice(
      0,
      need,
    );

    if (candidates.length === 0) continue;

    const rows = candidates.map((userId) => ({
      tool_id: toolId,
      user_id: userId,
      rating: randomInt(1, 6),
      content: '',
      created_at: randomPastDate(),
      updated_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase.from('tool_reviews').insert(rows);
    if (insertError) {
      throw new Error(`${tool.slug}: ${insertError.message}`);
    }

    insertedReviews += rows.length;
    console.log(`  + ${tool.name}: ${rows.length}건 (목표 ${targetCount}건)`);
  }

  console.log('');
  console.log(`완료 — 리뷰 ${insertedReviews}건 추가, ${skippedTools}개 서비스는 이미 충분함`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
