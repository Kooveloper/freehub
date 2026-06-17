'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  SIGNUP_PASSWORD_PLACEHOLDER,
  SIGNUP_PASSWORD_RULE_MESSAGE,
  isValidSignupPassword,
} from '@/lib/password';
import { UI_INPUT_CLASS, uiButtonPrimaryClass } from '@/lib/ui/form';
import { useLocale } from '@/contexts/LocaleContext';

interface ProfileData {
  nickname: string;
  email: string;
  isEmailUser: boolean;
}

export function ProfileSettingsForm() {
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/profile');
      const json = await response.json();
      if (!response.ok) {
        throw new Error(typeof json.error === 'string' ? json.error : '조회 실패');
      }

      setProfile({
        nickname: json.profile?.nickname ?? '',
        email: json.email ?? '',
        isEmailUser: Boolean(json.isEmailUser),
      });
      setNickname(json.profile?.nickname ?? '');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '조회 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (profile?.isEmailUser && !currentPassword) {
      setError(t('dashboard.currentPasswordRequired'));
      return;
    }

    if (newPassword && !isValidSignupPassword(newPassword)) {
      setError(SIGNUP_PASSWORD_RULE_MESSAGE);
      return;
    }

    if (newPassword && newPassword !== newPasswordConfirm) {
      setError(t('dashboard.passwordMismatch'));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPassword || undefined,
          nickname,
          newPassword: newPassword || undefined,
          newPasswordConfirm: newPasswordConfirm || undefined,
        }),
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(typeof json.error === 'string' ? json.error : '저장 실패');
      }

      setSuccess(t('dashboard.profileSaved'));
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
      if (json.profile?.nickname) {
        setNickname(json.profile.nickname);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="py-12 text-sm text-gray-500">{t('common.loading')}</p>;
  }

  if (!profile) {
    return (
      <p className="py-8 text-sm text-red-600">
        {error || t('dashboard.profileLoadFailed')}
      </p>
    );
  }

  return (
    <section>
      <h2 className="text-xl font-bold text-gray-900">{t('dashboard.profile')}</h2>
      <p className="mt-1 text-sm text-gray-500">{t('dashboard.profileDescription')}</p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {t('dashboard.email')}
          </label>
          <input
            type="email"
            value={profile.email}
            disabled
            className={UI_INPUT_CLASS + ' bg-gray-50 text-gray-500'}
          />
        </div>

        {profile.isEmailUser && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t('dashboard.currentPassword')}
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              className={UI_INPUT_CLASS}
              placeholder={t('dashboard.currentPasswordPlaceholder')}
            />
            <p className="mt-1 text-xs text-gray-400">
              {t('dashboard.currentPasswordHint')}
            </p>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {t('dashboard.nickname')}
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            minLength={2}
            maxLength={20}
            autoComplete="nickname"
            className={UI_INPUT_CLASS}
          />
        </div>

        {profile.isEmailUser && (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('dashboard.newPassword')}
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                placeholder={SIGNUP_PASSWORD_PLACEHOLDER}
                className={UI_INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('dashboard.newPasswordConfirm')}
              </label>
              <input
                type="password"
                value={newPasswordConfirm}
                onChange={(event) => setNewPasswordConfirm(event.target.value)}
                autoComplete="new-password"
                className={UI_INPUT_CLASS}
              />
            </div>
          </>
        )}

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-green-600" role="status">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className={uiButtonPrimaryClass(saving)}
        >
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </form>
    </section>
  );
}
