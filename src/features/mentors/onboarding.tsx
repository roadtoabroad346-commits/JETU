'use client';
import { useState } from 'react';
import type { Locale } from '@/lib/i18n/messages';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { requestData } from '@/features/writing/client';
import { mentorCopy, label } from './copy';
import { type Command, type Workspace, serviceKinds } from './contracts';
import { MentorAvailability } from './availability';
import { csv } from './client';
type Run = (value: Command) => Promise<void>;
export function MentorOnboarding({
  locale,
  data,
  run,
  busy,
}: {
  locale: Locale;
  data: Workspace;
  run: Run;
  busy: boolean;
}) {
  const t = mentorCopy[locale],
    p = data.profile;
  const [uploading, setUploading] = useState(false),
    [uploadError, setUploadError] = useState(false);
  const editable = !p || ['draft', 'needs_info', 'rejected'].includes(p.state);
  async function upload(form: HTMLFormElement) {
    const fields = new FormData(form),
      file = fields.get('file');
    if (!(file instanceof File)) return;
    setUploading(true);
    setUploadError(false);
    try {
      if (
        file.size < 1 ||
        file.size > 3145728 ||
        !['application/pdf', 'image/png', 'image/jpeg'].includes(file.type)
      )
        throw new Error('invalid');
      const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
      if (!(
        (file.type === 'application/pdf' &&
          new TextDecoder().decode(bytes).startsWith('%PDF-')) ||
        (file.type === 'image/png' &&
          bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10') ||
        (file.type === 'image/jpeg' &&
          bytes[0] === 255 &&
          bytes[1] === 216 &&
          bytes[2] === 255)
      ))
        throw new Error('invalid');
      const reserved = await requestData<{ id: string; path: string }>(
        '/api/mentors/evidence',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            op: 'reserve',
            claim: String(fields.get('claim')),
            mime: file.type,
            size: file.size,
          }),
        },
      );
      const { error } = await createBrowserSupabaseClient()
        .storage.from('mentor-evidence')
        .upload(reserved.path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      await requestData('/api/mentors/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: 'submit', id: reserved.id }),
      });
      window.location.reload();
    } catch {
      setUploadError(true);
    } finally {
      setUploading(false);
    }
  }
  return (
    <section className="mentor-stack">
      <header>
        <h2>{t.apply}</h2>
        <p>{t.conduct}</p>
        <a href={`/${locale}/privacy`}>{t.help}</a>
      </header>
      {p && (
        <div className="mentor-panel">
          <h3>
            {t.state}: {label(t, p.state)}
          </h3>
          <p>{p.decision_reason}</p>
          {p.verified_summary && <p>{p.verified_summary}</p>}
        </div>
      )}
      <form
        className="mentor-panel mentor-form"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void run({
            op: 'apply',
            name: String(f.get('name')),
            bio: String(f.get('bio')),
            expertise: csv(f.get('expertise')),
            languages: csv(f.get('languages')) as ('ru' | 'kk' | 'en')[],
            countries: csv(f.get('countries')),
            degrees: csv(f.get('degrees')) as (
              'bachelor' | 'master' | 'phd' | 'school'
            )[],
            timezone: String(f.get('timezone')),
            capacity: Number(f.get('capacity')),
            terms: true,
          });
        }}
      >
        <fieldset disabled={busy || !editable}>
          <legend>{t.apply}</legend>
          <label>
            {t.nameLabel}
            <input
              name="name"
              defaultValue={p?.display_name}
              minLength={2}
              maxLength={100}
              required
            />
          </label>
          <label>
            {t.bio}
            <textarea
              name="bio"
              defaultValue={p?.bio}
              minLength={10}
              maxLength={2000}
              required
            />
          </label>
          <label>
            {t.expertise}
            <input
              name="expertise"
              defaultValue={p?.expertise.join(', ')}
              required
            />
          </label>
          <label>
            {t.languages}
            <input
              name="languages"
              defaultValue={p?.languages.join(', ') ?? locale}
              required
            />
          </label>
          <label>
            {t.countries}
            <input
              name="countries"
              defaultValue={p?.countries.join(', ') ?? 'KZ'}
            />
          </label>
          <label>
            {t.degrees}
            <input
              name="degrees"
              defaultValue={p?.degrees.join(', ') ?? 'bachelor'}
            />
          </label>
          <label>
            {t.timezone}
            <input
              name="timezone"
              defaultValue={p?.timezone ?? 'Asia/Almaty'}
              required
            />
          </label>
          <label>
            {t.capacity}
            <input
              type="number"
              name="capacity"
              min={1}
              max={20}
              defaultValue={p?.capacity ?? 3}
              required
            />
          </label>
          <label className="mentor-check">
            <input type="checkbox" name="terms" required />
            {t.applyTerms}
          </label>
          <button className="ui-button ui-button--primary">
            {t.saveApplication}
          </button>
        </fieldset>
      </form>
      {p && editable && (
        <form
          className="mentor-panel mentor-form"
          onSubmit={(e) => {
            e.preventDefault();
            void upload(e.currentTarget);
          }}
        >
          <h3>{t.evidence}</h3>
          <p>{t.retention}</p>
          <label>
            {t.claim}
            <textarea name="claim" minLength={10} maxLength={1000} required />
          </label>
          <label>
            {t.evidence}
            <input
              type="file"
              name="file"
              accept="application/pdf,image/png,image/jpeg"
              required
            />
          </label>
          {uploadError && <p role="alert">{t.failed}</p>}
          <button
            className="ui-button ui-button--primary"
            disabled={uploading || busy}
          >
            {uploading ? t.loading : t.upload}
          </button>
        </form>
      )}
      {p && (
        <form
          className="mentor-panel mentor-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void run({
              op: 'service',
              kind: String(f.get('kind')) as (typeof serviceKinds)[number],
              summary: String(f.get('summary')),
              deliverables: String(f.get('deliverables')),
              hours: Number(f.get('hours')),
              price: Number(f.get('price')),
              currency: String(f.get('currency')) as 'KZT' | 'USD' | 'EUR',
            });
          }}
        >
          <h3>{t.services}</h3>
          <label>
            {t.service}
            <select name="kind">
              {serviceKinds.map((k) => (
                <option key={k} value={k}>
                  {label(t, k)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t.serviceSummary}
            <textarea name="summary" minLength={10} maxLength={1000} required />
          </label>
          <label>
            {t.deliverables}
            <textarea
              name="deliverables"
              minLength={10}
              maxLength={2000}
              required
            />
          </label>
          <label>
            {t.hours}
            <input
              name="hours"
              type="number"
              min={1}
              max={720}
              defaultValue={72}
              required
            />
          </label>
          <label>
            {t.amount}
            <input
              name="price"
              type="number"
              min={0}
              defaultValue={0}
              required
            />
          </label>
          <label>
            {t.currency}
            <select name="currency">
              <option>KZT</option>
              <option>USD</option>
              <option>EUR</option>
            </select>
          </label>
          <p>{t.terms}</p>
          <button className="ui-button ui-button--primary" disabled={busy}>
            {t.saveService}
          </button>
        </form>
      )}
      {p?.state === 'verified' && (
        <form
          className="mentor-panel mentor-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void run({
              op: 'slot',
              start: new Date(String(f.get('start'))).toISOString(),
              end: new Date(String(f.get('end'))).toISOString(),
              timezone: p.timezone,
            });
          }}
        >
          <h3>{t.session}</h3>
          <label>
            {t.slotStart}
            <input
              name="start"
              placeholder="2026-12-01T10:00:00+05:00"
              pattern=".*(Z|[+-][0-9]{2}:[0-9]{2})"
              required
            />
          </label>
          <label>
            {t.slotEnd}
            <input
              name="end"
              placeholder="2026-12-01T11:00:00+05:00"
              pattern=".*(Z|[+-][0-9]{2}:[0-9]{2})"
              required
            />
          </label>
          <p>{p.timezone}</p>
          <button disabled={busy} className="ui-button ui-button--primary">
            {t.saveSlot}
          </button>
        </form>
      )}
      {p?.state === 'verified' && (
        <MentorAvailability locale={locale} data={data} run={run} busy={busy} />
      )}
    </section>
  );
}
export function MentorAdmin({
  locale,
  data,
  run,
  busy,
}: {
  locale: Locale;
  data: Workspace;
  run: Run;
  busy: boolean;
}) {
  const t = mentorCopy[locale];
  const [contexts, setContexts] = useState<
    Record<string, { body?: string; quote?: string; author?: string }>
  >({});
  const [contextError, setContextError] = useState(false);
  async function viewCase(id: string) {
    try {
      const result = await requestData<{
        context: { body?: string; quote?: string; author?: string };
      }>(`/api/mentors?case=${id}`);
      setContexts((v) => ({ ...v, [id]: result.context }));
      setContextError(false);
    } catch {
      setContextError(true);
    }
  }
  if (!data.actor.verifier && !data.actor.moderator)
    return <p>{t.staffOnly}</p>;
  return (
    <section className="mentor-stack">
      <h2>{t.admin}</h2>
      {data.actor.verifier && (
        <>
          <h3>{t.queue}</h3>
          {data.profiles.length === 0 && <p>{t.noQueue}</p>}
          {data.profiles.map((p) => (
            <form
              key={p.user_id}
              className="mentor-panel mentor-form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                void run({
                  op: 'verify',
                  mentor: p.user_id,
                  revision: p.revision,
                  state: String(f.get('state')) as
                    | 'verified'
                    | 'rejected'
                    | 'needs_info'
                    | 'suspended'
                    | 'revoked',
                  reason: String(f.get('reason')),
                  summary: String(f.get('summary')),
                  attest: true,
                });
              }}
            >
              <h3>
                {p.display_name} · {label(t, p.state)}
              </h3>
              <p>{p.bio}</p>
              {data.evidence
                .filter((v) => v.mentor_id === p.user_id)
                .map((v) => (
                  <div key={v.id}>
                    <p>
                      {v.claim} · {label(t, v.state)}
                    </p>
                    <a href={`/api/mentors/evidence?id=${v.id}`}>
                      {t.viewEvidence}
                    </a>
                  </div>
                ))}
              <label>
                {t.decision}
                <select name="state">
                  {(p.state === 'verified'
                    ? ['suspended', 'revoked']
                    : p.state === 'suspended'
                      ? ['needs_info', 'verified', 'revoked']
                      : ['needs_info', 'verified', 'rejected']
                  ).map((s) => (
                    <option key={s} value={s}>
                      {label(t, s)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t.verifiedSummary}
                <textarea
                  name="summary"
                  defaultValue={p.verified_summary}
                  minLength={10}
                  maxLength={1000}
                  required
                />
              </label>
              <label>
                {t.decisionReason}
                <textarea
                  name="reason"
                  minLength={10}
                  maxLength={1000}
                  required
                />
              </label>
              <label className="mentor-check">
                <input type="checkbox" required />
                {t.attest}
              </label>
              <button disabled={busy} className="ui-button ui-button--primary">
                {t.saveDecision}
              </button>
            </form>
          ))}
        </>
      )}
      {data.actor.moderator && (
        <>
          <form
            className="mentor-panel mentor-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void run({
                op: 'clearance',
                student: String(f.get('student')),
                until: new Date(String(f.get('until'))).toISOString(),
                guardianRequired: f.get('guardian') === 'on',
                reason: String(f.get('reason')),
                attest: true,
              });
            }}
          >
            <h3>{t.clearStudent}</h3>
            <label>
              {t.studentId}
              <input name="student" required />
            </label>
            <label>
              {t.until}
              <input name="until" type="datetime-local" required />
            </label>
            <label className="mentor-check">
              <input name="guardian" type="checkbox" />
              {t.guardian}
            </label>
            <label>
              {t.reason}
              <textarea
                name="reason"
                minLength={10}
                maxLength={1000}
                required
              />
            </label>
            <label className="mentor-check">
              <input type="checkbox" required />
              {t.attest}
            </label>
            <button disabled={busy} className="ui-button ui-button--primary">
              {t.clearStudent}
            </button>
          </form>
          <h3>{t.reportStatus}</h3>
          {data.reports.map((r) => (
            <form
              className="mentor-panel mentor-form"
              key={r.id}
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                if (
                  (e.nativeEvent as SubmitEvent).submitter?.getAttribute(
                    'value',
                  ) === 'freeze'
                ) {
                  void run({
                    op: 'case_suspend',
                    case: r.id,
                    reason: String(f.get('reason')),
                    attest: true,
                  });
                  return;
                }
                void run({
                  op: 'moderate',
                  id: r.id,
                  revision: r.revision,
                  state: String(f.get('state')) as
                    'triaged' | 'investigating' | 'actioned' | 'closed',
                  reason: String(f.get('reason')),
                });
              }}
            >
              <p>
                {label(t, r.reason)} · {label(t, r.status)}
              </p>
              <p>{r.explanation}</p>
              <button
                type="button"
                className="ui-button ui-button--secondary"
                onClick={() => void viewCase(r.id)}
              >
                {t.caseEvidence}
              </button>
              {contextError && <p role="alert">{t.errorPermission}</p>}
              {contexts[r.id] && (
                <article>
                  <h4>{t.reportedComment}</h4>
                  <blockquote>{contexts[r.id]?.quote}</blockquote>
                  <p>{contexts[r.id]?.body ?? t.none}</p>
                </article>
              )}

              <label>
                {t.status}
                <select name="state">
                  {(r.status === 'new'
                    ? ['triaged']
                    : r.status === 'triaged' || r.status === 'appealed'
                      ? ['investigating']
                      : ['actioned', 'closed']
                  ).map((s) => (
                    <option key={s} value={s}>
                      {label(t, s)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t.reason}
                <textarea
                  name="reason"
                  minLength={10}
                  maxLength={1000}
                  required
                />
              </label>
              <button
                disabled={busy}
                className="ui-button ui-button--secondary"
              >
                {t.moderate}
              </button>
              <label className="mentor-check">
                <input type="checkbox" required />
                {t.attest}
              </label>
              <button
                disabled={busy}
                className="ui-button ui-button--secondary"
                type="submit"
                name="action"
                value="freeze"
              >
                {t.freeze}
              </button>
            </form>
          ))}
        </>
      )}
    </section>
  );
}
