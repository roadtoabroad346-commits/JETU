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
  const dismissed = useRef(false);
  const [value, setValue] = useState(defaultValue);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    request.current?.abort();
    if (!focused || value.trim().length < 2) {
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    const timer = window.setTimeout(async () => {
      if (controller.signal.aborted || dismissed.current) return;
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
        if (controller.signal.aborted || dismissed.current) return;
        setItems(body.data?.items ?? []);
        setActive(-1);
        setOpen(true);
      } catch {
        if (!controller.signal.aborted) {
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
  }, [focused, locale, type, value]);

  useEffect(() => {
    if (open && active >= 0) {
      document
        .getElementById(`${listId}-${active}`)
        ?.scrollIntoView({ block: 'nearest' });
    }
  }, [active, listId, open]);

  function dismiss() {
    dismissed.current = true;
    request.current?.abort();
    setOpen(false);
    setActive(-1);
    setLoading(false);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      dismiss();
      return;
    }
    if (items.length === 0 || event.nativeEvent.isComposing) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((current) => (current + 1) % items.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActive((current) => (current <= 0 ? items.length - 1 : current - 1));
    } else if (event.key === 'Enter' && open && active >= 0) {
      event.preventDefault();
      window.location.assign(items[active]!.href);
    }
  }

  return (
    <div
      className="search-combobox"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          dismiss();
          setFocused(false);
        }
      }}
    >
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
        aria-expanded={open && items.length > 0}
        aria-controls={open && items.length > 0 ? listId : undefined}
        aria-activedescendant={
          open && active >= 0 ? `${listId}-${active}` : undefined
        }
        onChange={(event) => {
          const nextValue = event.currentTarget.value;
          request.current?.abort();
          dismissed.current = false;
          setValue(nextValue);
          setItems([]);
          setActive(-1);
          setOpen(false);
          setLoading(false);
        }}
        onFocus={() => {
          dismissed.current = false;
          setFocused(true);
          if (items.length > 0) setOpen(true);
        }}
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
            <li role="none" key={`${item.type}:${item.id}`}>
              <a
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                href={item.href}
                tabIndex={-1}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActive(index)}
              >
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
