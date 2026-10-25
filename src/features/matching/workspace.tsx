'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { saveCatalogItem } from '@/features/search/actions';
import { searchCopy } from '@/features/search/copy';
import { authCopy } from '@/lib/i18n/auth';
import type { Locale } from '@/lib/i18n/messages';
import { matchingCopy } from './copy';
import { localizedReason, localizedRule } from './localized';
import {
  profileReadiness,
  type MatchingPreferences,
  type MatchingProfile,
  type Recommendation,
} from './engine';

type ApiData = {
  state: {
    profile: MatchingProfile;
    profileVersion: number | null;
    preferences: MatchingPreferences;
  };
  run: { id: string; created_at: string } | null;
  results: Recommendation[];
};
const levels = [
  'foundation',
  'associate',
  'bachelor',
  'master',
  'doctorate',
] as const;
const splitCodes = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
const splitText = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
const localeTag: Record<Locale, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  kk: 'kk-KZ',
};

export function MatchingWorkspace({ locale }: { locale: Locale }) {
  const t = matchingCopy[locale];
  const options = searchCopy[locale].option;
  const missingLabels: Record<string, string> = {
    studyLevel: authCopy[locale].studyLevel,
    field: authCopy[locale].field,
    budget: authCopy[locale].budget,
    nationality: t.nationality,
    educationLevel: t.educationLevel,
    graduationYear: t.graduationYear,
    testScores: t.testScores,
  };
  const [state, setState] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [countries, setCountries] = useState('');
  const [majors, setMajors] = useState('');
  const [languages, setLanguages] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [fundingRequired, setFundingRequired] = useState(false);
  const [year, setYear] = useState('');
  const [term, setTerm] = useState('');
  const [compare, setCompare] = useState<number[]>([]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/matching/run', { cache: 'no-store' });
      if (!response.ok) throw new Error('load');
      const payload = (await response.json()) as { data: ApiData };
      const next = payload.data;
      setState(next);
      setCountries(next.state.preferences.countries.join(', '));
      setMajors(next.state.preferences.majors.join(', '));
      setLanguages(next.state.preferences.languages.join(', '));
      setSelectedLevels(next.state.preferences.levels);
      setFundingRequired(next.state.preferences.fundingRequired);
      setYear(next.state.preferences.enrollmentYear?.toString() ?? '');
      setTerm(next.state.preferences.enrollmentTerm ?? '');
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/matching/run', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('load');
        return (await response.json()) as { data: ApiData };
      })
      .then(({ data: next }) => {
        if (controller.signal.aborted) return;
        setState(next);
        setCountries(next.state.preferences.countries.join(', '));
        setMajors(next.state.preferences.majors.join(', '));
        setLanguages(next.state.preferences.languages.join(', '));
        setSelectedLevels(next.state.preferences.levels);
        setFundingRequired(next.state.preferences.fundingRequired);
        setYear(next.state.preferences.enrollmentYear?.toString() ?? '');
        setTerm(next.state.preferences.enrollmentTerm ?? '');
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(t.error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [t.error]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!state?.state.profileVersion || running) return;
    setRunning(true);
    setError('');
    setCompare([]);
    const input = {
      countries: splitCodes(countries),
      majors: splitText(majors),
      levels: selectedLevels,
      languages: splitText(languages).map((item) => item.toLowerCase()),
      fundingRequired,
      ...(year ? { enrollmentYear: Number(year) } : {}),
      ...(term.trim() ? { enrollmentTerm: term.trim().toLowerCase() } : {}),
    };
    try {
      const response = await fetch('/api/matching/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok)
        throw new Error(response.status === 429 ? 'rate' : 'run');
      const payload = (await response.json()) as {
        data: { results: Recommendation[]; runId: string };
      };
      setState({
        ...state,
        results: payload.data.results,
        run: { id: payload.data.runId, created_at: new Date().toISOString() },
        state: { ...state.state, preferences: input as MatchingPreferences },
      });
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message === 'rate'
          ? t.rateLimited
          : t.error,
      );
    } finally {
      setRunning(false);
    }
  }

  const readiness = state ? profileReadiness(state.state.profile) : null;
  return (
    <main
      id="main"
      tabIndex={-1}
      className="dashboard-main page-shell matching-page"
    >
      <header className="matching-header">
        <p className="eyebrow">JETU / MATCH</p>
        <h1>{t.title}</h1>
        <p>{t.intro}</p>
      </header>
      {loading && (
        <div className="matching-skeleton" role="status" aria-label={t.running}>
          <span />
          <span />
          <span />
        </div>
      )}
      {error && (
        <div className="feedback-box feedback-box--error" role="alert">
          {error}{' '}
          <button
            type="button"
            className="ui-button ui-button--ghost"
            onClick={() => void load()}
          >
            {t.retry}
          </button>
        </div>
      )}
      {state && (
        <>
          <section
            className="ui-card matching-readiness"
            aria-labelledby="readiness-title"
          >
            <div>
              <p className="eyebrow">01 / {t.readiness}</p>
              <h2 id="readiness-title">
                {readiness?.complete} / {readiness?.total}
              </h2>
              <p>
                {t.missing}:{' '}
                {readiness?.missing.length
                  ? readiness.missing
                      .map((item) => missingLabels[item] ?? item)
                      .join(', ')
                  : '—'}
              </p>
            </div>
            <a
              className="ui-button ui-button--secondary"
              href={`/${locale}/onboarding`}
            >
              {t.updateProfile}
            </a>
          </section>
          <section
            className="ui-card matching-controls"
            aria-labelledby="preferences-title"
          >
            <p className="eyebrow">02 / {t.preferences}</p>
            <h2 id="preferences-title">{t.preferences}</h2>
            <form onSubmit={(event) => void submit(event)}>
              <div className="matching-form-grid">
                <label className="ui-field">
                  <span>{t.countries}</span>
                  <input
                    value={countries}
                    onChange={(event) => setCountries(event.target.value)}
                    maxLength={60}
                    placeholder="KZ, DE"
                  />
                </label>
                <label className="ui-field">
                  <span>{t.majors}</span>
                  <input
                    value={majors}
                    onChange={(event) => setMajors(event.target.value)}
                    maxLength={250}
                  />
                </label>
                <label className="ui-field">
                  <span>{t.languages}</span>
                  <input
                    value={languages}
                    onChange={(event) => setLanguages(event.target.value)}
                    maxLength={60}
                    placeholder="en, de"
                  />
                </label>
                <label className="ui-field">
                  <span>{t.year}</span>
                  <input
                    type="number"
                    min={2020}
                    max={2200}
                    value={year}
                    onChange={(event) => setYear(event.target.value)}
                  />
                </label>
                <label className="ui-field">
                  <span>{t.term}</span>
                  <input
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    maxLength={30}
                    placeholder="fall"
                  />
                </label>
              </div>
              <fieldset className="matching-levels">
                <legend>{t.levels}</legend>
                <div>
                  {levels.map((level) => (
                    <label key={level}>
                      <input
                        type="checkbox"
                        checked={selectedLevels.includes(level)}
                        onChange={() =>
                          setSelectedLevels((current) =>
                            current.includes(level)
                              ? current.filter((item) => item !== level)
                              : [...current, level],
                          )
                        }
                      />
                      {options[level]}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="matching-check">
                <input
                  type="checkbox"
                  checked={fundingRequired}
                  onChange={(event) => setFundingRequired(event.target.checked)}
                />{' '}
                {t.funding}
              </label>
              <div className="matching-actions">
                <button
                  type="submit"
                  className="ui-button ui-button--primary"
                  disabled={running || !state.state.profileVersion}
                  aria-busy={running}
                >
                  {running ? t.running : t.run}
                </button>
                {compare.length >= 2 && (
                  <a
                    className="ui-button ui-button--secondary"
                    href={`/${locale}/compare?ids=${compare.join(',')}`}
                  >
                    {t.compare} ({compare.length})
                  </a>
                )}
              </div>
            </form>
          </section>
          <section className="matching-results" aria-labelledby="results-title">
            <p className="eyebrow">03 / {t.results}</p>
            <h2 id="results-title">{t.results}</h2>
            {state.run && (
              <p className="matching-muted">
                {t.recent}:{' '}
                {new Intl.DateTimeFormat(localeTag[locale], {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(state.run.created_at))}
              </p>
            )}
            {state.run && state.results.length === 0 && (
              <p className="ui-card matching-empty">{t.empty}</p>
            )}
            {!state.run && <p className="ui-card matching-empty">{t.run}</p>}
            {state.results.map((result) => {
              const c = result.candidate;
              const detail = `/${locale}${c.detailPath.startsWith('/') ? c.detailPath : `/${c.detailPath}`}`;
              const groups = {
                MET: result.rules.filter((rule) => rule.status === 'MET'),
                NOT_MET: result.rules.filter(
                  (rule) => rule.status === 'NOT_MET',
                ),
                UNKNOWN: result.rules.filter(
                  (rule) => rule.status === 'UNKNOWN',
                ),
              };
              return (
                <article
                  key={`${c.entityType}-${c.id}`}
                  className="ui-card matching-result"
                >
                  <div className="matching-result-top">
                    <div>
                      <p className="eyebrow">
                        {c.entityType === 'program' ? t.program : t.scholarship}{' '}
                        · {c.country ?? '—'} · {c.degree ?? '—'}
                      </p>
                      <h3>{c.title}</h3>
                      <p>{c.subtitle}</p>
                    </div>
                    <span
                      className={`ui-badge ${result.eligibility === 'not_eligible' ? 'ui-badge--danger' : result.eligibility === 'eligible' ? 'ui-badge--success' : 'ui-badge--warning'}`}
                    >
                      {t[result.eligibility]}
                    </span>
                  </div>
                  <div className="matching-facts">
                    <p>
                      <strong>{t.score}:</strong>{' '}
                      {result.preferenceScore === null
                        ? '—'
                        : `${result.preferenceScore}/100`}{' '}
                      <small>
                        ({t.assessed}: {result.assessedWeight}/100)
                      </small>
                    </p>
                    <p>
                      <strong>{t.deadline}:</strong>{' '}
                      {c.deadlineAt
                        ? new Intl.DateTimeFormat(localeTag[locale], {
                            dateStyle: 'medium',
                          }).format(new Date(c.deadlineAt))
                        : '—'}
                    </p>
                    {c.entityType === 'scholarship' && (
                      <p>
                        <strong>{t.coverage}:</strong>{' '}
                        {c.coverage.length ? c.coverage.join(', ') : '—'}
                      </p>
                    )}
                  </div>
                  <p className="matching-muted">
                    {t.scoreNote} {t.noDecision}
                  </p>
                  {result.preferenceReasons.length > 0 && (
                    <p>
                      {result.preferenceReasons
                        .map((reason) => localizedReason(locale, reason))
                        .join(' ')}
                    </p>
                  )}
                  <details>
                    <summary>
                      {t.met} ({groups.MET.length}) · {t.unmet} (
                      {groups.NOT_MET.length}) · {t.unknown} (
                      {groups.UNKNOWN.length})
                    </summary>
                    {(
                      [
                        ['MET', t.met],
                        ['NOT_MET', t.unmet],
                        ['UNKNOWN', t.unknown],
                      ] as const
                    ).map(
                      ([key, label]) =>
                        groups[key].length > 0 && (
                          <div key={key} className="matching-rule-group">
                            <h4>{label}</h4>
                            <ul>
                              {groups[key].map((rule) => (
                                <li key={rule.id}>
                                  <strong>{rule.requirement}</strong> —{' '}
                                  {localizedRule(locale, rule)}{' '}
                                  <small>
                                    ({t.verification[rule.verification]})
                                  </small>
                                  {rule.sourceUrl && (
                                    <a
                                      href={rule.sourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {t.source}
                                    </a>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ),
                    )}
                  </details>
                  <div className="matching-result-actions">
                    <a className="ui-button ui-button--secondary" href={detail}>
                      {t.details}
                    </a>
                    {c.entityType === 'program' && (
                      <>
                        <form action={saveCatalogItem.bind(null, locale, c.id)}>
                          <button
                            className="ui-button ui-button--ghost"
                            type="submit"
                          >
                            {t.save}
                          </button>
                        </form>
                        <label className="matching-check">
                          <input
                            type="checkbox"
                            checked={compare.includes(c.id)}
                            disabled={
                              !compare.includes(c.id) && compare.length >= 4
                            }
                            onChange={() =>
                              setCompare((current) =>
                                current.includes(c.id)
                                  ? current.filter((id) => id !== c.id)
                                  : [...current, c.id],
                              )
                            }
                          />{' '}
                          {t.compare}
                        </label>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        </>
      )}
    </main>
  );
}
