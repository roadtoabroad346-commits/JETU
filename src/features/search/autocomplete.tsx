'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { Locale } from '@/lib/i18n/messages';
import type { SearchEntityType } from './server';

type Suggestion = {
  id: string;
  title: string;
  subtitle: string | null;
  type: SearchEntityType;
  href: string;
};

export function SearchAutocomplete({
  locale,
  label,
  hint,
  suggestionsLabel,
  loadingLabel,
  emptyLabel,
  defaultValue,
  type,
}: {
  locale: Locale;
  label: string;
  hint: string;
  suggestionsLabel: string;
  loadingLabel: string;
  emptyLabel: string;
  defaultValue: string;
  type: SearchEntityType | '';
}) {
  const listId = useId();
  const request = useRef<AbortController | null>(null);
  const [value, setValue] = useState(defaultValue);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    request.current?.abort();
    if (value.trim().length < 2) {
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ q: value.trim(), type, locale });
        const response = await fetch(`/api/search/suggest?${params}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
        const body = (await response.json()) as {
          data?: { items?: Suggestion[] };
        };
        if (!response.ok) throw new Error('suggestion request failed');
        setItems(body.data?.items ?? []);
        setActive(-1);
        setOpen(true);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setItems([]);
          setOpen(false);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [locale, type, value]);

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || items.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((current) => (current + 1) % items.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((current) => (current <= 0 ? items.length - 1 : current - 1));
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActive(-1);
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault();
      window.location.assign(items[active]!.href);
    }
  }

  return (
    <div className="search-combobox">
      <label htmlFor={`${listId}-input`}>{label}</label>
      <input
        id={`${listId}-input`}
        name="q"
        type="search"
        maxLength={120}
        autoComplete="off"
        value={value}
        placeholder={hint}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(event) => {
          const nextValue = event.currentTarget.value;
          setValue(nextValue);
          if (nextValue.trim().length < 2) {
            setItems([]);
            setOpen(false);
            setLoading(false);
          }
        }}
        onFocus={() => items.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
      />
      <span className="sr-only" role="status" aria-live="polite">
        {loading ? loadingLabel : open && items.length === 0 ? emptyLabel : ''}
      </span>
      {open && items.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label={suggestionsLabel}
          className="search-suggestions"
        >
          {items.map((item, index) => (
            <li
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              key={`${item.type}:${item.id}`}
            >
              <a href={item.href} onMouseEnter={() => setActive(index)}>
                <strong>{item.title}</strong>
                <span>{item.subtitle}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
