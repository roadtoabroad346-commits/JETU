'use client';

// Multi-step animated profile questionnaire. Contract notes:
// - Every input keeps the exact server-action field name it had before, and
//   all inputs stay mounted (hidden panes included) so one server action
//   receives the complete FormData, exactly like the original single form.
// - The client checks are convenience only: src/features/onboarding/steps.ts
//   mirrors the authoritative zod schema, which still validates everything.
// - Without JavaScript the SSR markup shows the same fields as one readable
//   page (all panes open); wizard behaviour replaces it after hydration.
//   This follows the mount-gate pattern used by the design-system Showcase.
import { motion, useReducedMotion } from 'motion/react';
import {
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { useFormStatus } from 'react-dom';
import { Icon } from '@/components/ui/icon';
import { authCopy } from '@/lib/i18n/auth';
import { matchingCopy } from '@/features/matching/copy';
import { searchCopy } from '@/features/search/copy';
import type { Locale } from '@/lib/i18n/messages';
import { formatTemplate, onboardingCopy } from './copy';
import {
  EDUCATION_LEVELS,
  STEPS,
  STEP_FIELDS,
  STUDY_LEVELS,
  TEST_CODES,
  TEST_RANGE,
  progressFraction,
  validateAll,
  validateField,
  validateStep,
  type FieldIssue,
  type FieldName,
  type StepId,
  type WizardValues,
} from './steps';

const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export type WizardDefaults = Partial<
  Record<FieldName, string | number | null | undefined>
>;

function toWizardValues(defaults: WizardDefaults): WizardValues {
  const normalized = {} as WizardValues;
  for (const field of [
    STEP_FIELDS.about,
    STEP_FIELDS.background,
    STEP_FIELDS.academics,
    STEP_FIELDS.scores,
  ].flat()) {
    const raw = defaults[field];
    normalized[field] = raw === null || raw === undefined ? '' : String(raw);
  }
  return normalized;
}

export function ProfileWizard({
  locale,
  action,
  defaults,
  loadFailed,
  invalid,
}: {
  locale: Locale;
  action: (formData: FormData) => void | Promise<void>;
  defaults: WizardDefaults;
  loadFailed: boolean;
  invalid: boolean;
}) {
  const t = authCopy[locale];
  const m = matchingCopy[locale];
  const w = onboardingCopy[locale];
  const reduce = useReducedMotion();
  const interactive = useSyncExternalStore(
    subscribeToHydration,
    clientReady,
    serverReady,
  );
  const [values, setValues] = useState<WizardValues>(() =>
    toWizardValues(defaults),
  );
  const [step, setStep] = useState<StepId>('about');
  const [direction, setDirection] = useState(1);
  const [attempted, setAttempted] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const isReview = step === 'review';
  const shownIssues: FieldIssue[] = isReview
    ? validateAll(values)
    : attempted
      ? validateStep(step, values)
      : [];

  const update =
    (field: FieldName) => (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.value;
      setValues((current) => ({ ...current, [field]: next }));
    };

  const goTo = (next: StepId, dir: number) => {
    setDirection(dir);
    setAttempted(false);
    setStep(next);
    // The heading exists regardless of the re-render, but it may still be
    // hidden when focus is requested, so wait one frame like the Showcase.
    requestAnimationFrame(() => {
      const heading = document.getElementById(`wiz-heading-${next}`);
      heading?.focus({ preventScroll: false });
    });
  };

  const advance = () => {
    const blockers = validateStep(step, values);
    if (blockers.length) {
      setAttempted(true);
      const firstField = blockers[0]!.field;
      requestAnimationFrame(() => {
        document.getElementById(firstField)?.focus();
      });
      return;
    }
    goTo(STEPS[stepIndex + 1]!, 1);
  };

  const retreat = () => {
    if (stepIndex === 0) return;
    goTo(STEPS[stepIndex - 1]!, -1);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const blockers = validateAll(values);
    if (!blockers.length) return;
    event.preventDefault();
    const firstBroken = blockers[0]!.field;
    const ownerStep = STEP_FIELDS.about.includes(firstBroken)
      ? 'about'
      : STEP_FIELDS.background.includes(firstBroken)
        ? 'background'
        : STEP_FIELDS.academics.includes(firstBroken)
          ? 'academics'
          : 'scores';
    goTo(ownerStep, 1);
    setAttempted(true);
    requestAnimationFrame(() => {
      document.getElementById(firstBroken)?.focus();
    });
  };

  const stepAlert = shownIssues.length > 0 && (
    <div
      className="error-summary wiz-alert"
      role="alert"
      aria-labelledby="wiz-error-title"
      tabIndex={-1}
    >
      <strong id="wiz-error-title">{w.errorTitle}</strong>
      {shownIssues.map((issue) => (
        <a key={`${issue.field}:${issue.key}`} href={`#${issue.field}`}>
          {w.errorKeys[issue.key]} — {fieldTitle(locale, issue.field)}
        </a>
      ))}
    </div>
  );

  return (
    <form
      action={action}
      noValidate
      onSubmit={handleSubmit}
      className="wiz"
      id="profile-wizard"
    >
      <div className="wiz-head">
        <p className="eyebrow">JETU / {t.onboarding}</p>
        <h1 id="profile-title" tabIndex={-1}>
          {t.onboardingTitle}
        </h1>
        <p className="auth-lead">{t.onboardingBody}</p>
        {loadFailed && (
          <p className="feedback-box feedback-box--error" role="alert">
            {t.profileLoadError}
          </p>
        )}
        {invalid && (
          <p className="feedback-box feedback-box--error" role="alert">
            {t.invalid}
          </p>
        )}
      </div>

      {stepAlert}

      {interactive && (
        <div className="wiz-rail">
          <div
            className="wiz-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={STEPS.length - 1}
            aria-valuenow={stepIndex}
            aria-label={formatTemplate(w.progressLabel, {
              n: String(stepIndex + 1),
              m: String(STEPS.length),
              name: w.stepNames[step],
            })}
          >
            <motion.span
              className="wiz-progress-fill"
              initial={false}
              animate={{ scaleX: progressFraction(step) }}
              transition={{
                duration: reduce ? 0 : 0.3,
                ease: [0.2, 0.8, 0.2, 1],
              }}
              style={{ transformOrigin: '0% 50%' }}
            />
          </div>
          <ol className="wiz-dots" aria-hidden="true">
            {STEPS.map((entry, index) => (
              <li
                key={entry}
                className={
                  index === stepIndex
                    ? 'wiz-dot wiz-dot--current'
                    : index < stepIndex
                      ? 'wiz-dot wiz-dot--done'
                      : 'wiz-dot'
                }
              />
            ))}
          </ol>
          <p className="wiz-counter tabular" aria-hidden="true">
            {stepIndex + 1} / {STEPS.length}
          </p>
        </div>
      )}

      {/* All panes stay mounted so FormData always carries every input. */}
      {STEPS.map((entry, index) => {
        const visible = !interactive || entry === step;
        const pane = (
          <>
            <header className="wiz-pane-head">
              <span className="wiz-step-number" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h2 id={`wiz-heading-${entry}`} tabIndex={-1}>
                  {w.stepNames[entry]}
                </h2>
                <p className="wiz-caption">{w.stepCaptions[entry]}</p>
              </div>
            </header>
            {entry === 'about' && (
              <>
                <TextField
                  id="country"
                  label={`${t.country}`}
                  requiredMark
                  value={values.country}
                  onChange={update('country')}
                  autoComplete="country-name"
                  maxLength={80}
                  error={fieldErrorText(locale, 'country', values)}
                />
                <TileGroup
                  name="studyLevel"
                  legend={`${t.studyLevel}`}
                  requiredMark
                  entries={STUDY_LEVELS.map((level) => ({
                    value: level,
                    label: searchCopy[locale].option[level],
                  }))}
                  value={values.studyLevel}
                  onChange={update('studyLevel')}
                  tone="tile"
                />
                <TextField
                  id="field"
                  label={`${t.field}`}
                  requiredMark
                  value={values.field}
                  onChange={update('field')}
                  maxLength={120}
                  error={fieldErrorText(locale, 'field', values)}
                />
                <TextField
                  id="budget"
                  label={t.budget}
                  requiredMark
                  value={values.budget}
                  onChange={update('budget')}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={1_000_000}
                  step={1}
                  hint={w.budgetHint}
                  error={fieldErrorText(locale, 'budget', values)}
                />
              </>
            )}
            {entry === 'background' && (
              <>
                <TextField
                  id="nationality"
                  label={m.nationality}
                  value={values.nationality}
                  onChange={update('nationality')}
                  autoComplete="off"
                  maxLength={2}
                  hint={w.codeHint}
                  error={fieldErrorText(locale, 'nationality', values)}
                />
                <TextField
                  id="residency"
                  label={m.residency}
                  value={values.residency}
                  onChange={update('residency')}
                  autoComplete="off"
                  maxLength={2}
                  hint={w.codeHint}
                  error={fieldErrorText(locale, 'residency', values)}
                />
                <TileGroup
                  name="educationLevel"
                  legend={m.educationLevel}
                  entries={[
                    { value: '', label: '—' },
                    ...EDUCATION_LEVELS.map((level) => ({
                      value: level,
                      label:
                        level === 'secondary'
                          ? m.secondary
                          : level === 'other'
                            ? m.other
                            : searchCopy[locale].option[level],
                    })),
                  ]}
                  value={values.educationLevel}
                  onChange={update('educationLevel')}
                  tone="chip"
                />
                <TextField
                  id="graduationYear"
                  label={m.graduationYear}
                  value={values.graduationYear}
                  onChange={update('graduationYear')}
                  type="number"
                  inputMode="numeric"
                  min={1950}
                  max={2200}
                  hint={w.yearHint}
                  error={fieldErrorText(locale, 'graduationYear', values)}
                />
              </>
            )}
            {entry === 'academics' && (
              <>
                <TextField
                  id="gpa"
                  label={m.gpa}
                  value={values.gpa}
                  onChange={update('gpa')}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step="any"
                  hint={w.gpaHint}
                  error={fieldErrorText(locale, 'gpa', values)}
                />
                <TextField
                  id="gpaScale"
                  label={m.gpaScale}
                  value={values.gpaScale}
                  onChange={update('gpaScale')}
                  type="number"
                  inputMode="decimal"
                  min={0.1}
                  max={100}
                  step="any"
                  hint={w.gpaHint}
                  error={fieldErrorText(locale, 'gpaScale', values)}
                />
              </>
            )}
            {entry === 'scores' && (
              <div className="wiz-scores">
                {TEST_CODES.map((code) => (
                  <TextField
                    key={code}
                    id={code.toLowerCase()}
                    label={code}
                    value={values[code.toLowerCase() as FieldName]}
                    onChange={update(code.toLowerCase() as FieldName)}
                    type="number"
                    inputMode="numeric"
                    min={TEST_RANGE[code].min}
                    max={TEST_RANGE[code].max}
                    step="any"
                    hint={
                      code === 'SAT'
                        ? w.satHint
                        : code === 'ACT'
                          ? w.actHint
                          : `${TEST_RANGE[code].min}–${TEST_RANGE[code].max}`
                    }
                    error={fieldErrorText(
                      locale,
                      code.toLowerCase() as FieldName,
                      values,
                    )}
                  />
                ))}
                <p className="wiz-scores-note">{w.scoresHint}</p>
              </div>
            )}
            {entry === 'review' && (
              <ReviewBlock locale={locale} values={values} onEdit={goTo} />
            )}
          </>
        );
        return (
          <motion.section
            key={entry}
            className="wiz-pane"
            hidden={!visible}
            aria-labelledby={visible ? `wiz-heading-${entry}` : undefined}
            initial={false}
            animate={
              visible ? { opacity: 1, x: 0 } : { opacity: 0, x: direction * 24 }
            }
            transition={{
              duration: reduce ? 0 : 0.22,
              ease: [0.2, 0.8, 0.2, 1],
            }}
          >
            {pane}
          </motion.section>
        );
      })}

      <input type="hidden" name="locale" value={locale} />

      {interactive ? (
        <div className="wiz-nav">
          {stepIndex > 0 && (
            <button type="button" className="wiz-back" onClick={retreat}>
              <Icon name="arrowUp" />
              {w.stepBack}
            </button>
          )}
          {isReview ? (
            <SubmitButton idle={t.save} busy={w.saving} />
          ) : (
            <button
              type="button"
              className="ui-button ui-button--primary wiz-next"
              onClick={advance}
            >
              {w.next}
              <Icon name="arrow" />
            </button>
          )}
        </div>
      ) : (
        <div className="row">
          <button className="ui-button ui-button--primary" type="submit">
            {t.save}
          </button>
          <a
            className="ui-button ui-button--ghost"
            href={`/${locale}/dashboard`}
          >
            {t.back}
          </a>
        </div>
      )}
    </form>
  );
}

function fieldErrorText(
  locale: Locale,
  field: FieldName,
  values: WizardValues,
): string | undefined {
  const issue = validateField(field, values)[0];
  return issue
    ? onboardingCopy[locale as Locale].errorKeys[issue.key]
    : undefined;
}

function fieldTitle(locale: string, field: FieldName): string {
  const t = authCopy[locale as Locale];
  const m = matchingCopy[locale as Locale];
  switch (field) {
    case 'country':
      return t.country;
    case 'studyLevel':
      return t.studyLevel;
    case 'field':
      return t.field;
    case 'budget':
      return t.budget;
    case 'nationality':
      return m.nationality;
    case 'residency':
      return m.residency;
    case 'educationLevel':
      return m.educationLevel;
    case 'graduationYear':
      return m.graduationYear;
    case 'gpa':
      return m.gpa;
    case 'gpaScale':
      return m.gpaScale;
    default:
      return field.toUpperCase();
  }
}

function TextField({
  id,
  label,
  requiredMark,
  value,
  onChange,
  error,
  hint,
  type = 'text',
  inputMode,
  min,
  max,
  step,
  maxLength,
  autoComplete,
}: {
  id: string;
  label: string;
  requiredMark?: boolean;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  hint?: string;
  type?: 'text' | 'number';
  inputMode?: 'numeric' | 'decimal';
  min?: number;
  max?: number;
  step?: number | 'any';
  maxLength?: number;
  autoComplete?: string;
}) {
  const noteId = hint ? `${id}-note` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <label className="ui-field wiz-field" htmlFor={id}>
      <span>
        {label}
        {requiredMark && (
          <span className="wiz-required" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </span>
      <input
        id={id}
        name={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        autoComplete={autoComplete}
        min={min}
        max={max}
        step={step}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [noteId, errorId].filter(Boolean).join(' ') || undefined
        }
      />
      {hint && (
        <p className="field-hint" id={`${id}-note`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </label>
  );
}

function TileGroup({
  name,
  legend,
  requiredMark,
  entries,
  value,
  onChange,
  tone,
}: {
  name: string;
  legend: string;
  requiredMark?: boolean;
  entries: { value: string; label: string }[];
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  tone: 'tile' | 'chip';
}) {
  return (
    <fieldset className={`ui-field wiz-group wiz-group--${tone}`}>
      <legend>
        {legend}
        {requiredMark && (
          <span className="wiz-required" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </legend>
      <div className="wiz-choices">
        {entries.map((entry) => (
          <label
            key={entry.value || 'none'}
            className={tone === 'tile' ? 'wiz-tile' : 'wiz-chip'}
          >
            <input
              className="wiz-sr-input"
              type="radio"
              name={name}
              value={entry.value}
              checked={value === entry.value}
              onChange={onChange}
            />
            <span className={tone === 'tile' ? 'wiz-tile-box' : 'wiz-chip-box'}>
              {tone === 'tile' && (
                <span className="wiz-tile-index" aria-hidden="true">
                  {String(entries.indexOf(entry) + 1).padStart(2, '0')}
                </span>
              )}
              {entry.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ReviewBlock({
  locale,
  values,
  onEdit,
}: {
  locale: Locale;
  values: WizardValues;
  onEdit: (target: StepId, direction: number) => void;
}) {
  const t = authCopy[locale];
  const m = matchingCopy[locale];
  const options = searchCopy[locale].option;
  const w = onboardingCopy[locale];
  const rows: { step: StepId; label: string; value: string }[] = [];
  rows.push({ step: 'about', label: t.country, value: values.country });
  rows.push({
    step: 'about',
    label: t.studyLevel,
    value: STUDY_LEVELS.includes(
      values.studyLevel as (typeof STUDY_LEVELS)[number],
    )
      ? options[values.studyLevel as (typeof STUDY_LEVELS)[number]]
      : '',
  });
  rows.push({ step: 'about', label: t.field, value: values.field });
  rows.push({
    step: 'about',
    label: t.budget,
    value: values.budget
      ? formatTemplate(w.budgetFormat, { value: values.budget })
      : '',
  });
  rows.push({
    step: 'background',
    label: m.nationality,
    value: values.nationality,
  });
  rows.push({
    step: 'background',
    label: m.residency,
    value: values.residency,
  });
  rows.push({
    step: 'background',
    label: m.educationLevel,
    value:
      values.educationLevel === ''
        ? ''
        : values.educationLevel === 'secondary'
          ? m.secondary
          : values.educationLevel === 'other'
            ? m.other
            : options[values.educationLevel as 'bachelor' | 'master'],
  });
  rows.push({
    step: 'background',
    label: m.graduationYear,
    value: values.graduationYear,
  });
  if (values.gpa && values.gpaScale) {
    rows.push({
      step: 'academics',
      label: m.gpa,
      value: formatTemplate(w.gpaFormat, {
        value: values.gpa,
        scale: values.gpaScale,
      }),
    });
  }
  for (const code of TEST_CODES) {
    const score = values[code.toLowerCase() as FieldName];
    if (score) rows.push({ step: 'scores', label: code, value: score });
  }
  return (
    <div className="wiz-review">
      <h3>{w.reviewTitle}</h3>
      <p className="wiz-caption">{w.reviewBody}</p>
      <dl className="wiz-review-list">
        {rows.map((row) => (
          <div className="wiz-review-row" key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value || w.emptyValue}</dd>
          </div>
        ))}
      </dl>
      <div className="wiz-edit-row">
        {STEPS.filter((entry) => entry !== 'review').map((entry) => (
          <button
            key={entry}
            type="button"
            className="wiz-edit"
            onClick={() => onEdit(entry, 1)}
          >
            {formatTemplate(w.editStep, { name: w.stepNames[entry] })}
          </button>
        ))}
      </div>
    </div>
  );
}

function SubmitButton({ idle, busy }: { idle: string; busy: string }) {
  const status = useFormStatus();
  return (
    <button
      type="submit"
      className="ui-button ui-button--primary wiz-save"
      aria-busy={status.pending || undefined}
      disabled={status.pending}
    >
      {status.pending ? busy : idle}
      {status.pending && <span className="spinner" aria-hidden="true" />}
    </button>
  );
}

export function WizardSuccess({ locale }: { locale: string }) {
  const w = onboardingCopy[locale as Locale];
  const t = authCopy[locale as Locale];
  const reduce = useReducedMotion();
  const interactive = useSyncExternalStore(
    subscribeToHydration,
    clientReady,
    serverReady,
  );
  const staticView = !interactive || reduce;
  if (staticView) {
    return (
      <div className="wiz-done" role="status">
        <svg className="wiz-done-mark" viewBox="0 0 48 48" aria-hidden="true">
          <path
            d="M12 25 21 34 36 15"
            fill="none"
            stroke="currentColor"
            strokeWidth={4}
            strokeLinecap="round"
          />
        </svg>
        <h2>{w.savedTitle}</h2>
        <p>{w.savedBody}</p>
        <div className="row">
          <a className="ui-button ui-button--primary" href={`/${locale}/match`}>
            {w.openMatching}
            <Icon name="arrow" />
          </a>
          <a
            className="ui-button ui-button--secondary"
            href={`/${locale}/dashboard`}
          >
            {w.openDashboard}
          </a>
        </div>
        <span className="sr-only">{t.saved}</span>
      </div>
    );
  }
  return (
    <motion.div
      className="wiz-done"
      role="status"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <motion.svg
        className="wiz-done-mark"
        viewBox="0 0 48 48"
        aria-hidden="true"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      >
        <motion.path
          d="M12 25 21 34 36 15"
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.2 }}
        />
      </motion.svg>
      <h2>{w.savedTitle}</h2>
      <p>{w.savedBody}</p>
      <div className="row">
        <a className="ui-button ui-button--primary" href={`/${locale}/match`}>
          {w.openMatching}
          <Icon name="arrow" />
        </a>
        <a
          className="ui-button ui-button--secondary"
          href={`/${locale}/dashboard`}
        >
          {w.openDashboard}
        </a>
      </div>
      <span className="sr-only">{t.saved}</span>
    </motion.div>
  );
}
