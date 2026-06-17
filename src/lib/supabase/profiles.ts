import type { SupabaseClient, User } from '@supabase/supabase-js';

import { normalizeNickname, validateNickname } from '@/lib/nickname';

export interface UserProfile {
  user_id: string;
  nickname: string;
  created_at: string;
  updated_at: string;
}

export function getNicknameFromUserMetadata(user: User): string | null {
  const meta = user.user_metadata ?? {};
  const candidates = [meta.nickname, meta.full_name, meta.name];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return normalizeNickname(value);
    }
  }

  if (user.email) {
    return user.email.split('@')[0] ?? null;
  }

  return null;
}

export async function getProfileByUserId(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, nickname, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as UserProfile | null) ?? null;
}

export async function ensureUserProfile(
  supabase: SupabaseClient,
  user: User,
): Promise<{ profile: UserProfile | null; needsNickname: boolean }> {
  const existing = await getProfileByUserId(supabase, user.id);
  if (existing) {
    return { profile: existing, needsNickname: false };
  }

  const nickname = getNicknameFromUserMetadata(user);
  if (!nickname || validateNickname(nickname)) {
    return { profile: null, needsNickname: true };
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert({ user_id: user.id, nickname })
    .select('user_id, nickname, created_at, updated_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { profile: null, needsNickname: true };
    }
    throw new Error(error.message);
  }

  return { profile: data as UserProfile, needsNickname: false };
}

export async function createUserProfile(
  supabase: SupabaseClient,
  userId: string,
  nicknameInput: string,
): Promise<{ profile: UserProfile | null; error: string | null }> {
  const validationError = validateNickname(nicknameInput);
  if (validationError) {
    return { profile: null, error: validationError };
  }

  const nickname = normalizeNickname(nicknameInput);

  const { data, error } = await supabase
    .from('profiles')
    .insert({ user_id: userId, nickname })
    .select('user_id, nickname, created_at, updated_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { profile: null, error: '이미 사용 중인 닉네임입니다.' };
    }
    return { profile: null, error: error.message };
  }

  return { profile: data as UserProfile, error: null };
}

export async function updateUserNickname(
  supabase: SupabaseClient,
  userId: string,
  nicknameInput: string,
): Promise<{ profile: UserProfile | null; error: string | null }> {
  const validationError = validateNickname(nicknameInput);
  if (validationError) {
    return { profile: null, error: validationError };
  }

  const nickname = normalizeNickname(nicknameInput);

  const { data, error } = await supabase
    .from('profiles')
    .update({ nickname, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select('user_id, nickname, created_at, updated_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { profile: null, error: '이미 사용 중인 닉네임입니다.' };
    }
    return { profile: null, error: error.message };
  }

  return { profile: data as UserProfile, error: null };
}
