'use client';

import {
  LogOut,
  Menu,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

import { LanguageToggle } from '@/components/layout/LanguageToggle';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useLocale } from '@/contexts/LocaleContext';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export function Header() {
  const { t } = useLocale();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setProfileOpen(false);
    setMobileOpen(false);
  };

  const navLinkClass =
    'text-sm font-semibold text-neutral-700 transition-colors hover:text-black';

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-transparent bg-white transition-shadow',
        scrolled && 'border-neutral-200 bg-white/95 shadow-sm backdrop-blur-md',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandLogo className="text-black hover:text-neutral-700" />

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/" className={navLinkClass}>
            {t('nav.home')}
          </Link>
          <Link href="/compare" className={navLinkClass}>
            {t('nav.compare')}
          </Link>
          <Link href="/submit" className={navLinkClass}>
            {t('nav.submit')}
          </Link>
          <Link href="/blog" className={navLinkClass}>
            {t('nav.blog')}
          </Link>
          {user && (
            <Link href="/dashboard" className={navLinkClass}>
              {t('nav.myPage')}
            </Link>
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageToggle />

          {user ? (
            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-neutral-700 transition-colors hover:bg-neutral-100"
                aria-label={t('nav.profileMenu')}
                aria-expanded={profileOpen}
              >
                <User className="h-5 w-5" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-lg border border-neutral-200 bg-white py-2 shadow-lg">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50"
                    onClick={() => setProfileOpen(false)}
                  >
                    <User className="h-4 w-4 text-neutral-600" />
                    {t('nav.myPage')}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
            >
              {t('nav.login')}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LanguageToggle />
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-700 transition-colors hover:bg-neutral-100"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-neutral-200 bg-white md:hidden">
          <nav className="flex flex-col px-4 py-4">
            <Link
              href="/"
              className="py-2.5 text-base font-semibold text-neutral-900"
              onClick={() => setMobileOpen(false)}
            >
              {t('nav.home')}
            </Link>
            <Link
              href="/compare"
              className="py-2.5 text-base font-semibold text-neutral-900"
              onClick={() => setMobileOpen(false)}
            >
              {t('nav.compare')}
            </Link>
            <Link
              href="/submit"
              className="py-2.5 text-base font-semibold text-neutral-900"
              onClick={() => setMobileOpen(false)}
            >
              {t('nav.submit')}
            </Link>
            <Link
              href="/blog"
              className="py-2.5 text-base font-semibold text-neutral-900"
              onClick={() => setMobileOpen(false)}
            >
              {t('nav.blog')}
            </Link>

            {user && (
              <Link
                href="/dashboard"
                className="py-2.5 text-base font-semibold text-neutral-900"
                onClick={() => setMobileOpen(false)}
              >
                {t('nav.myPage')}
              </Link>
            )}

            <div className="mt-4 border-t border-neutral-100 pt-4">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 py-2.5 text-base font-semibold text-neutral-900"
                    onClick={() => setMobileOpen(false)}
                  >
                    <User className="h-4 w-4 text-neutral-600" />
                    {t('nav.myPage')}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 py-2.5 text-base font-semibold text-neutral-900"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="block rounded-lg bg-black px-4 py-2.5 text-center text-base font-semibold text-white hover:bg-neutral-800"
                  onClick={() => setMobileOpen(false)}
                >
                  {t('nav.login')}
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
