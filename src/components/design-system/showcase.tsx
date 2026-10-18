'use client';

import { useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { z } from 'zod';
import { BrandLogo } from '@/components/ui/brand';
import { Icon } from '@/components/ui/icon';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Progress,
  Select,
  Sidebar,
  Skeleton,
  Timeline,
} from '@/components/ui/primitives';
import { Dialog, Stepper, Tabs, Tooltip } from '@/components/ui/interactions';
import type { DesignMessages } from '@/lib/i18n/design-system';
import type { Locale } from '@/lib/i18n/messages';

const sectionIds = [
  'identity',
  'actions',
  'forms',
  'overlays',
  'data',
  'journey',
] as const;
type SectionId = (typeof sectionIds)[number];
const previewSchema = z.string().trim().min(2).max(80);
const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

function Section({
  id,
  number,
  title,
  body,
  children,
}: {
  id: SectionId;
  number: number;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <section
      className="showcase-section"
      id={id}
      tabIndex={-1}
      aria-labelledby={`${id}-title`}
    >
      <div className="section-heading">
        <span className="section-number" aria-hidden="true">
          {String(number).padStart(2, '0')}
        </span>
        <div>
          <h2 id={`${id}-title`}>{title}</h2>
          <p>{body}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function PreviewForm({ t }: { t: DesignMessages }) {
  const [error, setError] = useState(false);
  const [submitted, setSubmitted] = useState<{
    text: string;
    style: string;
  } | null>(null);
  const summary = useRef<HTMLDivElement>(null);
  return (
    <Card>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const result = previewSchema.safeParse(data.get('previewText'));
          setError(!result.success);
          setSubmitted(null);
          if (!result.success)
            requestAnimationFrame(() => summary.current?.focus());
          else
            setSubmitted({
              text: result.data,
              style: String(data.get('style')),
            });
        }}
      >
        {error && (
          <div
            className="error-summary"
            role="alert"
            aria-labelledby="preview-error-title"
            tabIndex={-1}
            ref={summary}
          >
            <strong id="preview-error-title">{t.errorSummary}</strong>
            <a href="#preview-text">{t.validationError}</a>
          </div>
        )}
        <div className="form-grid">
          <Field
            id="preview-text"
            name="previewText"
            label={t.textLabel}
            hint={t.hint}
            error={error ? t.validationError : undefined}
            required
            autoComplete="off"
            defaultValue="Әлемге жол · Путь в мир"
          />
          <Select id="preview-style" name="style" label={t.style}>
            <option value="body">{t.bodyStyle}</option>
            <option value="title">{t.titleStyle}</option>
          </Select>
        </div>
        <Button type="submit">
          {t.preview}
          <Icon name="arrow" />
        </Button>
        {submitted && (
          <div className="preview-output">
            <p role="status" className="success-text">
              {t.localSuccess}
            </p>
            <output
              aria-label={t.previewOutput}
              className={submitted.style === 'title' ? 'type-title' : ''}
            >
              {submitted.text}
            </output>
          </div>
        )}
      </form>
    </Card>
  );
}

function Registry({ t, locale }: { t: DesignMessages; locale: Locale }) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
  const [ascending, setAscending] = useState(true);
  const entries = sectionIds.map((id) => ({
    id,
    label: t[id],
    group: id === 'identity' ? 'foundation' : 'interaction',
  }));
  const filtered = entries
    .filter(
      (item) =>
        item.label
          .toLocaleLowerCase(locale)
          .includes(query.trim().toLocaleLowerCase(locale)) &&
        (group === 'all' || item.group === group),
    )
    .sort(
      (a, b) => a.label.localeCompare(b.label, locale) * (ascending ? 1 : -1),
    );
  const clear = () => {
    setQuery('');
    setGroup('all');
  };
  return (
    <Card>
      <div className="form-grid">
        <Field
          id="registry-filter"
          label={t.filter}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select
          id="registry-group"
          label={t.group}
          value={group}
          onChange={(event) => setGroup(event.target.value)}
        >
          <option value="all">{t.all}</option>
          <option value="foundation">{t.foundationGroup}</option>
          <option value="interaction">{t.interactionGroup}</option>
        </Select>
      </div>
      <div className="row spread">
        <p role="status" className="muted">
          {t.results}: {filtered.length}
        </p>
        <Button
          variant="ghost"
          onClick={clear}
          disabled={!query && group === 'all'}
        >
          {t.clear}
        </Button>
      </div>
      {filtered.length ? (
        <table className="ui-table">
          <caption className="sr-only">{t.tableCaption}</caption>
          <thead>
            <tr>
              <th
                scope="col"
                aria-sort={ascending ? 'ascending' : 'descending'}
              >
                <button
                  type="button"
                  onClick={() => setAscending(!ascending)}
                  aria-label={t.sort}
                >
                  {t.name}
                  <Icon
                    name="arrowUp"
                    style={{
                      transform: ascending ? undefined : 'rotate(180deg)',
                    }}
                  />
                </button>
              </th>
              <th scope="col">{t.category}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id}>
                <td>
                  <a href={`#${item.id}`}>
                    {item.label}
                    <Icon name="arrow" />
                  </a>
                </td>
                <td>
                  {item.group === 'foundation'
                    ? t.foundationGroup
                    : t.interactionGroup}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <EmptyState title={t.noResults} description={t.noResultsBody}>
          <Button variant="secondary" onClick={clear}>
            {t.clear}
          </Button>
        </EmptyState>
      )}
    </Card>
  );
}

function Spotlight({
  t,
  items,
}: {
  t: DesignMessages;
  items: { id: string; label: string }[];
}) {
  const [query, setQuery] = useState('');
  const filtered = items.filter((item) =>
    item.label.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <Dialog
      trigger={t.search}
      title={t.search}
      description={t.searchDescription}
      closeLabel={t.close}
    >
      <>
        <Field
          id="spotlight-query"
          type="search"
          label={t.query}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <p className="muted" role="status">
          {t.results}: {filtered.length}
        </p>
        {filtered.length ? (
          <ul className="spotlight-results">
            {filtered.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(event) => {
                    event.currentTarget.closest('dialog')?.close();
                    requestAnimationFrame(() =>
                      document.getElementById(item.id)?.focus(),
                    );
                  }}
                >
                  {item.label}
                  <Icon name="arrow" />
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title={t.noResults} description={t.noResultsBody}>
            <Button variant="secondary" onClick={() => setQuery('')}>
              {t.clear}
            </Button>
          </EmptyState>
        )}
      </>
    </Dialog>
  );
}

export function Showcase({ t, locale }: { t: DesignMessages; locale: Locale }) {
  const interactive = useSyncExternalStore(
    subscribeToHydration,
    clientReady,
    serverReady,
  );
  const items = sectionIds.map((id) => ({ id, label: t[id] }));
  const [feedback, setFeedback] = useState('idle');
  const steps = [
    { title: t.define, description: t.defineBody },
    { title: t.build, description: t.buildBody },
    { title: t.verify, description: t.verifyBody },
  ];
  return (
    <fieldset className="showcase-layout" disabled={!interactive}>
      <aside className="showcase-aside">
        <p className="eyebrow">JETU / UI KIT</p>
        <Sidebar items={items} label={t.navigation} />
        <Spotlight t={t} items={items} />
      </aside>
      <div className="showcase-content">
        <Section
          id="identity"
          number={1}
          title={t.identity}
          body={t.identityBody}
        >
          <Card className="identity-card">
            <div className="logo-board">
              <BrandLogo />
              <BrandLogo compact />
            </div>
            <p className="muted">{t.logoNote}</p>
          </Card>
          <div className="swatch-grid">
            {[
              'brand',
              'accent',
              'ink',
              'surface-blue',
              'primary',
              'success',
              'warning',
              'danger',
            ].map((token) => (
              <div className="swatch" key={token}>
                <span style={{ background: `var(--${token})` }} />
                <code>{token}</code>
              </div>
            ))}
          </div>
          <div className="type-specimen">
            <p className="type-title">{t.typeSample}</p>
            <p>{t.typeBody}</p>
            <p className="muted">4 / 8 / 16 / 24 / 32 / 48 / 64</p>
          </div>
        </Section>
        <Section id="actions" number={2} title={t.actions} body={t.actionsBody}>
          <Card>
            <div className="row">
              <Button
                onClick={() => setFeedback('success')}
                pending={feedback === 'loading'}
                state={
                  feedback === 'success'
                    ? 'success'
                    : feedback === 'error'
                      ? 'error'
                      : 'idle'
                }
              >
                {t.tryAction}
                <Icon name="arrow" />
              </Button>
              <Button variant="accent" onClick={() => setFeedback('idle')}>
                {t.reset}
              </Button>
              <Button disabled>{t.disabled}</Button>
              <Button pending>{t.pending}</Button>
            </div>
            <div className="row badge-row">
              <Badge tone="primary">{t.pill}</Badge>
              <Badge tone="success">✓ {t.success}</Badge>
              <Badge tone="warning">! {t.warning}</Badge>
              <Badge tone="danger">! {t.error}</Badge>
            </div>
            <Select
              id="feedback-state"
              label={t.state}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
            >
              <option value="idle">{t.idle}</option>
              <option value="loading">{t.pending}</option>
              <option value="success">{t.success}</option>
              <option value="error">{t.error}</option>
            </Select>
            <p className="field-hint">{t.feedbackHint}</p>
            <div
              className={`feedback-box feedback-box--${feedback}`}
              role="status"
            >
              {feedback === 'success' ? (
                <>
                  <Icon name="check" />
                  {t.success}
                </>
              ) : feedback === 'error' ? (
                t.errorBody
              ) : feedback === 'loading' ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  {t.pending}
                </>
              ) : (
                t.idle
              )}
            </div>
          </Card>
        </Section>
        <Section id="forms" number={3} title={t.forms} body={t.formsBody}>
          <PreviewForm t={t} />
        </Section>
        <Section
          id="overlays"
          number={4}
          title={t.overlays}
          body={t.overlaysBody}
        >
          <Card>
            <Tabs
              label={t.tabs}
              items={[
                {
                  id: 'overview',
                  label: t.overview,
                  content: <p>{t.overviewBody}</p>,
                },
                {
                  id: 'details',
                  label: t.details,
                  content: <p>{t.detailsBody}</p>,
                },
              ]}
            />
            <div className="row">
              <Dialog
                trigger={t.dialogTrigger}
                title={t.dialogTitle}
                description={t.dialogBody}
                closeLabel={t.close}
              >
                <form method="dialog">
                  <Button type="submit">{t.dialogDone}</Button>
                </form>
              </Dialog>
              <Tooltip label={t.tooltipBody}>{t.tooltip}</Tooltip>
            </div>
          </Card>
        </Section>
        <Section id="data" number={5} title={t.data} body={t.dataBody}>
          <Registry t={t} locale={locale} />
        </Section>
        <Section id="journey" number={6} title={t.journey} body={t.journeyBody}>
          <Card>
            <Stepper label={t.stepsLabel} steps={steps} />
            <Progress label={t.progress} value={64} />
          </Card>
          <div className="specimen-grid">
            <Card>
              <Timeline label={t.stepsLabel} items={steps} />
            </Card>
            <Card>
              <p className="eyebrow">{t.loading}</p>
              <Skeleton label={t.loading} />
              <p className="field-hint">{t.loadingNote}</p>
              <EmptyState title={t.empty} description={t.emptyBody}>
                <a className="ui-button ui-button--secondary" href="#identity">
                  {t.backTop}
                  <Icon name="arrow" />
                </a>
              </EmptyState>
            </Card>
          </div>
        </Section>
      </div>
    </fieldset>
  );
}
