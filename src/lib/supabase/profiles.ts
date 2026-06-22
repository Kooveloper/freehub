import type { SupabaseClient, User } from '@supabase/supabase-js';

import { normalizeNickname, validateNickname } from '@/lib/nickname';

export interface UserProfile {
  user_id: string;
  nickname: string;
  created_at: string;
  updated_at: string;
  terms_agreed_at: string | null;
  privacy_agreed_at: string | null;
  marketing_opt_in: boolean;
  marketing_opt_in_at: string | null;
}

export interface ProfileConsentInput {
  terms_agreed_at: string | null;
  privacy_agreed_at: string | null;
  marketing_opt_in: boolean;
  marketing_opt_in_at: string | null;
}

const PROFILE_COLUMNS =
  'user_id, nickname, created_at, updated_at, terms_agreed_at, privacy_agreed_at, marketing_opt_in, marketing_opt_in_at';

export function getConsentFromUserMetadata(
  user: User,
): ProfileConsentInput | null {
  const meta = user.user_metadata ?? {};
  const termsAgreedAt =
    typeof meta.terms_agreed_at === 'string' ? meta.terms_agreed_at : null;
  const privacyAgreedAt =
    typeof meta.privacy_agreed_at === 'string' ? meta.privacy_agreed_at : null;
  const marketingOptIn = Boolean(meta.marketing_opt_in);
  const marketingOptInAt =
    typeof meta.marketing_opt_in_at === 'string' ? meta.marketing_opt_in_at : null;

  if (!termsAgreedAt || !privacyAgreedAt) return null;

  return {
    terms_agreed_at: termsAgreedAt,
    privacy_agreed_at: privacyAgreedAt,
    marketing_opt_in: marketingOptIn,
    marketing_opt_in_at: marketingOptIn ? marketingOptInAt ?? termsAgreedAt : null,
  };
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
    .select(PROFILE_COLUMNS)
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
    .insert({
      user_id: user.id,
      nickname,
      ...(getConsentFromUserMetadata(user) ?? {}),
    })
    .select(PROFILE_COLUMNS)
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
  consent?: ProfileConsentInput | null,
): Promise<{ profile: UserProfile | null; error: string | null }> {
  const validationError = validateNickname(nicknameInput);
  if (validationError) {
    return { profile: null, error: validationError };
  }

  const nickname = normalizeNickname(nicknameInput);

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      nickname,
      ...(consent ?? {}),
    })
    .select(PROFILE_COLUMNS)
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
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      return { profile: null, error: '이미 사용 중인 닉네임입니다.' };
    }
    return { profile: null, error: error.message };
  }

  return { profile: data as UserProfile, error: null };
}

export async function upsertProfileConsent(
  supabase: SupabaseClient,
  userId: string,
  consent: ProfileConsentInput,
): Promise<{ profile: UserProfile | null; error: string | null }> {
  if (!consent.terms_agreed_at || !consent.privacy_agreed_at) {
    return { profile: null, error: '필수 약관에 동의해 주세요.' };
  }

  const existing = await getProfileByUserId(supabase, userId);

  if (!existing) {
    return { profile: null, error: '프로필이 없습니다.' };
  }

  if (existing.terms_agreed_at && existing.privacy_agreed_at) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        marketing_opt_in: consent.marketing_opt_in,
        marketing_opt_in_at: consent.marketing_opt_in
          ? consent.marketing_opt_in_at ?? new Date().toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select(PROFILE_COLUMNS)
      .single();

    if (error) {
      return { profile: null, error: error.message };
    }

    return { profile: data as UserProfile, error: null };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      terms_agreed_at: consent.terms_agreed_at,
      privacy_agreed_at: consent.privacy_agreed_at,
      marketing_opt_in: consent.marketing_opt_in,
      marketing_opt_in_at: consent.marketing_opt_in ? consent.marketing_opt_in_at : null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    return { profile: null, error: error.message };
  }

  return { profile: data as UserProfile, error: null };
}
