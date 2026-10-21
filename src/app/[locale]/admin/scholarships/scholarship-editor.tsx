'use client';
import { useState } from 'react';

export function ScholarshipEditor({ role }: { role: string }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(form: HTMLFormElement, action: 'preview' | 'create') {
    const fields = new FormData(form);
    const payload = {
      action,
      slug: String(fields.get('slug') ?? ''),
      title: String(fields.get('title') ?? ''),
      provider_name: String(fields.get('provider_name') ?? ''),
      provider_country_code:
        String(fields.get('provider_country_code') ?? '') || undefined,
      official_url: String(fields.get('official_url') ?? ''),
      source: {
        url: String(fields.get('source_url') ?? ''),
        title: String(fields.get('source_title') ?? ''),
        publisher: String(fields.get('source_publisher') ?? ''),
        excerpt: String(fields.get('source_excerpt') ?? ''),
        locale: 'en',
      },
    };
    setBusy(true);
    try {
      const response = await fetch('/api/admin/scholarships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      setMessage(
        response.ok
          ? action === 'preview'
            ? result.duplicate
              ? 'Duplicate slug: revise before creating.'
              : 'Ready to create as a draft.'
            : `Draft created: ${result.id}`
          : (result.error ?? 'Request failed'),
      );
    } catch {
      setMessage('Request failed. Check your connection and retry.');
    } finally {
      setBusy(false);
    }
  }
  async function transition(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const response = await fetch('/api/admin/scholarships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: fields.get('id'),
          action: fields.get('action'),
          note: fields.get('note'),
        }),
      });
      const result = await response.json();
      setMessage(
        response.ok
          ? `Scholarship ${result.id}: ${result.action}`
          : (result.error ?? 'Request failed'),
      );
    } catch {
      setMessage('Request failed. Check your connection and retry.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="scholarship-detail-grid">
      <form
        className="scholarship-editor-form"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(event.currentTarget, 'create');
        }}
      >
        <h2>Create a draft</h2>
        <label>
          Unique slug
          <input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" />
        </label>
        <label>
          Title
          <input name="title" required minLength={2} />
        </label>
        <label>
          Provider name
          <input name="provider_name" required minLength={2} />
        </label>
        <label>
          Provider country code, if known
          <input
            name="provider_country_code"
            maxLength={2}
            pattern="[A-Z]{2}"
          />
        </label>
        <label>
          Official scholarship URL
          <input name="official_url" type="url" required />
        </label>
        <label>
          Official source URL
          <input name="source_url" type="url" required />
        </label>
        <label>
          Source title
          <input name="source_title" required />
        </label>
        <label>
          Publisher
          <input name="source_publisher" required />
        </label>
        <label>
          Claim excerpt
          <textarea name="source_excerpt" required minLength={10} rows={4} />
        </label>
        <div className="scholarship-pages">
          <button
            type="button"
            disabled={busy}
            onClick={(event) => {
              const form = event.currentTarget.form;
              if (form) void submit(form, 'preview');
            }}
          >
            Preview duplicate check
          </button>
          <button
            className="ui-button ui-button--primary"
            disabled={busy}
            type="submit"
          >
            Create draft
          </button>
        </div>
      </form>
      {role !== 'editor' && (
        <form className="scholarship-editor-form" onSubmit={transition}>
          <h2>Review and lifecycle</h2>
          <p>
            Confirm the current official source before recording a review.
            Changes are audited.
          </p>
          <label>
            Scholarship ID
            <input name="id" type="number" min="1" required />
          </label>
          <label>
            Action
            <select name="action">
              <option value="reviewed">Review source</option>
              <option value="published">Publish</option>
              <option value="reverified">Reverify</option>
              <option value="unpublished">Unpublish</option>
              <option value="archived">Archive</option>
            </select>
          </label>
          <label>
            Review note
            <textarea
              name="note"
              rows={4}
              placeholder="Dated source check and evidence"
            />
          </label>
          <button
            className="ui-button ui-button--primary"
            disabled={busy}
            type="submit"
          >
            Apply action
          </button>
        </form>
      )}
      <p role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
