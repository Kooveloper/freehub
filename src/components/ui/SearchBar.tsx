'use client';

import { Search, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import { ToolLogo } from '@/components/ui/ToolLogo';
import type { Tool } from '@/types/tool';

const SIZE_STYLES = {
  sm: 'h-9 text-sm',
  md: 'h-11 text-sm',
  lg: 'h-12 text-base',
} as const;

interface SearchBarProps {
  size?: keyof typeof SIZE_STYLES;
  placeholder?: string;
  className?: string;
  defaultValue?: string;
  variant?: 'light' | 'dark';
}

/** debounce 자동완성 + Enter 시 /search?q= 이동 */
export function SearchBar({
  size = 'md',
  placeholder,
  className,
  defaultValue = '',
  variant = 'light',
}: SearchBarProps) {
  const router = useRouter();
  const { t } = useLocale();
  const resolvedPlaceholder = placeholder ?? t('search.placeholder');
  const listboxId = useId();
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<Tool[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const navigateToSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed) {
        setIsOpen(false);
        router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      }
    },
    [router],
  );

  const fetchSuggestions = useCallback(async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(trimmed)}&limit=5`,
        { signal: controller.signal },
      );

      if (!res.ok) throw new Error('검색 실패');

      const data = (await res.json()) as { tools: Tool[] };
      setSuggestions(data.tools ?? []);
      setIsOpen((data.tools ?? []).length > 0);
      setActiveIndex(-1);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setSuggestions([]);
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();

    if (activeIndex >= 0 && suggestions[activeIndex]) {
      setIsOpen(false);
      router.push(`/tool/${suggestions[activeIndex].slug}`);
      return;
    }

    navigateToSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1,
      );
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleSuggestionClick = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const isDark = variant === 'dark';

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <form onSubmit={handleSubmit} role="search">
        <Search
          className={cn(
            'pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2',
            isDark ? 'text-neutral-500' : 'text-gray-400',
          )}
        />

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={resolvedPlaceholder}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          className={cn(
            'w-full rounded-lg border pl-10 pr-10 focus:outline-none focus:ring-2',
            isDark
              ? 'border-neutral-700 bg-neutral-900 text-white placeholder:text-neutral-500 focus:border-white focus:ring-white/20'
              : 'border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:ring-black/10',
            SIZE_STYLES[size],
          )}
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              'absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full p-0.5 transition-colors',
              isDark
                ? 'text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300'
                : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600',
            )}
            aria-label={t('search.clear')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {isOpen && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((tool, index) => (
            <li
              key={tool.id}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
            >
              <Link
                href={`/tool/${tool.slug}`}
                onClick={handleSuggestionClick}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 transition-colors',
                  index === activeIndex
                    ? 'bg-neutral-100 text-black'
                    : 'text-neutral-900 hover:bg-neutral-50',
                )}
              >
                <ToolLogo name={tool.name} logoUrl={tool.logo_url} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{tool.name}</p>
                  <p className="truncate text-xs text-gray-500">
                    {tool.description}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
