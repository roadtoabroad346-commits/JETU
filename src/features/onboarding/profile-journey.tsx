'use client';

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { JetuMascot } from '@/components/ui/mascot';
import { Icon } from '@/components/ui/icon';
import type { Locale } from '@/lib/i18n/messages';
import { authCopy } from '@/lib/i18n/auth';
import { journeyCopy } from './journey-copy';
import {
  initialProfileState,
  profileFormSchema,
  stepFields,
  type ProfileSaveState,
  type ProfileValues,
} from './model';

type Props = {
  locale: Locale;
  initial: ProfileValues;
  version: number;
  loadFailed?: boolean;
  action: (
    previous: ProfileSaveState,
    data: FormData,
  ) => Promise<ProfileSaveState>;
};
const fieldEmoji = ['💻', '💼', '⚙️', '🩺', '🎨', '🌍'];

function Choices({
  name,
  label,
  options,
  value,
  onChange,
  emojis = [],
  invalid = false,
}: {
  name: string;
  label: string;
  options: Record<string, string>;
  value: string;
  onChange: (value: string) => void;
  emojis?: string[];
  invalid?: boolean;
}) {
  return (
    <fieldset
      className="journey-choices"
      aria-describedby={invalid ? 'journey-validation' : undefined}
    >
      <legend>{label}</legend>
      <div className="choice-grid">
        {Object.entries(options).map(([code, text], index) => (
          <label
            className={`choice-card ${value === code ? 'is-selected' : ''}`}
            key={code}
          >
            <input
              id={
                name === 'studyLevel' && index === 0
                  ? 'journey-studyLevel'
                  : undefined
              }
              type="radio"
              name={`${name}-choice`}
              value={code}
              checked={value === code}
              onChange={() => onChange(code)}
            />
            <span aria-hidden="true" className="choice-emoji">
              {emojis[index] ?? '✦'}
            </span>
            <span>{text}</span>
            <span aria-hidden="true" className="choice-check">
              {value === code ? '✓' : '+'}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ProfileJourney({
  locale,
  initial,
  version,
  loadFailed = false,
  action,
}: Props) {
  const t = journeyCopy[locale];
  const [draft, setDraft] = useState(initial);
  const [customField, setCustomField] = useState(
    Boolean(initial.field) && !Object.hasOwn(t.fields, initial.field),
  );
  const [step, setStep] = useState(0);
  const [state, formAction, pending] = useActionState(
    action,
    initialProfileState,
  );
  const [invalid, setInvalid] = useState<string[]>([]);
  const [savedVersion, setSavedVersion] = useState(version);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const moved = useRef(false);
  const [hasChanged, setHasChanged] = useState(false);
  const saved =
    state.status === 'saved' && state.version !== savedVersion && !pending;

  useEffect(() => {
    if (moved.current) titleRef.current?.focus();
  }, [step]);
  useEffect(() => {
    if (state.status === 'error') errorRef.current?.focus();
  }, [state]);
  useEffect(() => {
    if (saved) titleRef.current?.focus();
  }, [saved]);
  useEffect(() => {
    if (!hasChanged || saved) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasChanged, saved]);

  function update(key: keyof ProfileValues, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setInvalid((current) => current.filter((field) => field !== key));
    setHasChanged(true);
  }
  function move(next: number) {
    moved.current = true;
    setInvalid([]);
    setStep(next);
  }
  function validate(currentStep?: number) {
    const result = profileFormSchema.safeParse(draft);
    const fields = result.success
      ? []
      : result.error.issues.map((issue) => String(issue.path[0]));
    const relevant =
      currentStep === undefined
        ? fields
        : fields.filter((field) =>
            (stepFields[currentStep] as readonly string[]).includes(field),
          );
    setInvalid(relevant);
    if (relevant.length) {
      const firstStep = stepFields.findIndex((keys) =>
        (keys as readonly string[]).includes(relevant[0]!),
      );
      if (currentStep === undefined && firstStep >= 0) {
        moved.current = true;
        setStep(firstStep);
      }
      window.requestAnimationFrame(() =>
        formRef.current
          ?.querySelector<HTMLElement>(`#journey-${relevant[0]}`)
          ?.focus(),
      );
    }
    return relevant.length === 0;
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    if (step < 4) {
      event.preventDefault();
      if (validate(step)) move(step + 1);
      return;
    }
    if (!validate()) event.preventDefault();
  }
  function exportAnswers() {
    const blob = new Blob(
      [
        JSON.stringify(
          { profile: draft, exportedAt: new Date().toISOString() },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jetu-my-profile.json';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const input = (
    key: keyof ProfileValues,
    label: string,
    type = 'text',
    min?: number,
    max?: number,
    help?: string,
  ) => (
    <label className="ui-field" htmlFor={`journey-${key}`}>
      <span id={`label-${key}`}>{label}</span>
      <input
        id={`journey-${key}`}
        aria-labelledby={`label-${key}`}
        type={type}
        min={min}
        max={max}
        step={type === 'number' ? 'any' : undefined}
        value={draft[key]}
        maxLength={
          type === 'text'
            ? key === 'country'
              ? 80
              : key === 'nationality' || key === 'residency'
                ? 2
                : 120
            : undefined
        }
        onChange={(event) => update(key, event.target.value)}
        aria-invalid={invalid.includes(key)}
        aria-describedby={
          invalid.includes(key)
            ? 'journey-validation'
            : help
              ? `help-${key}`
              : undefined
        }
      />
      {help && <small id={`help-${key}`}>{help}</small>}
    </label>
  );
  const format = (amount: string) =>
    amount === ''
      ? t.notProvided
      : new Intl.NumberFormat(locale === 'kk' ? 'kk-KZ' : locale, {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(Number(amount));

  if (saved)
    return (
      <main id="main" tabIndex={-1} className="journey-success page-shell">
        <JetuMascot mood="celebrate" />
        <section className="journey-card-panel">
          <p className="eyebrow">JETU / {t.companion}</p>
          <h1 ref={titleRef} tabIndex={-1}>
            {t.savedTitle}
          </h1>
          <p role="status">{t.savedBody}</p>
          <div className="journey-buttons">
            <a
              className="ui-button ui-button--primary"
              href={`/${locale}/match`}
            >
              {t.matching} <Icon name="arrow" />
            </a>
            <a
              className="ui-button ui-button--secondary"
              href={`/${locale}/search`}
            >
              {t.explore}
            </a>
          </div>
          <button
            className="ui-button ui-button--ghost"
            type="button"
            onClick={() => {
              setSavedVersion(state.version ?? savedVersion);
              setHasChanged(false);
              move(0);
            }}
          >
            {t.editAgain}
          </button>
          <p className="journey-note">{t.savedNote}</p>
        </section>
      </main>
    );

  return (
    <main id="main" tabIndex={-1} className="student-journey page-shell">
      <aside className="journey-companion">
        <p className="eyebrow">JETU / {t.companion}</p>
        <JetuMascot mood={pending ? 'thinking' : 'welcome'} />
        <p className="mascot-speech" key={step}>
          {t.speech[step]}
        </p>
        <span className="journey-private">
          <Icon name="check" /> {t.private}
        </span>
      </aside>
      <div className="journey-workspace">
        <nav
          aria-label={authCopy[locale].onboarding}
          className="journey-step-nav"
        >
          <ol>
            {t.steps.map((label, index) => (
              <li key={label}>
                <button
                  type="button"
                  aria-current={index === step ? 'step' : undefined}
                  disabled={pending || index > step}
                  onClick={() => move(index)}
                >
                  <span>
                    {index < step ? '✓' : String(index + 1).padStart(2, '0')}
                  </span>
                  <span>{label}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <div className="journey-progress-label">
          <span>
            {t.step} {step + 1} {t.of} 5
          </span>
          <span>{Math.round(((step + 1) / 5) * 100)}%</span>
        </div>
        <progress
          className="journey-progress"
          value={step + 1}
          max={5}
          aria-label={`${t.step} ${step + 1} ${t.of} 5`}
        />
        <form
          ref={formRef}
          action={formAction}
          onSubmit={submit}
          noValidate
          className="journey-card-panel"
          aria-busy={pending}
        >
          <input name="locale" type="hidden" value={locale} />
          <input name="version" type="hidden" value={savedVersion} />
          {Object.entries(draft).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
          <fieldset
            disabled={pending || loadFailed}
            className="journey-fieldset"
          >
            <legend className="sr-only">{t.steps[step]}</legend>
            <header className="journey-step-heading">
              <p className="journey-overline">
                0{step + 1} / {t.steps[step]}
              </p>
              <h1 ref={titleRef} tabIndex={-1}>
                {t.titles[step]}
              </h1>
              <p>{t.descriptions[step]}</p>
            </header>
            {loadFailed && (
              <p role="alert" className="feedback-box feedback-box--error">
                {t.loadFailed}
              </p>
            )}
            {state.status === 'error' && (
              <div
                ref={errorRef}
                tabIndex={-1}
                role="alert"
                className="feedback-box feedback-box--error"
              >
                {state.error === 'conflict'
                  ? t.conflict
                  : state.error === 'session'
                    ? t.session
                    : state.error === 'invalid'
                      ? t.invalid
                      : t.errors.unavailable}
                {state.error === 'conflict' && (
                  <a
                    href={`/${locale}/onboarding`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t.reload} <Icon name="arrow" />
                  </a>
                )}
                {state.error === 'session' && (
                  <a
                    href={`/${locale}/login`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {authCopy[locale].signIn} <Icon name="arrow" />
                  </a>
                )}
              </div>
            )}
            {invalid.length > 0 && (
              <p
                id="journey-validation"
                role="alert"
                className="feedback-box feedback-box--error"
              >
                {t.invalid}
              </p>
            )}
            <div className="journey-step-content" key={step}>
              {step === 0 && (
                <>
                  <Choices
                    name="grade"
                    label={`${t.grade} · ${t.optional}`}
                    options={t.grades}
                    value={draft.grade}
                    onChange={(value) => update('grade', value)}
                    emojis={['🌱', '🌿', '🌟', '🎯', '🎓', '🚀', '📚', '🧭']}
                  />
                  {input(
                    'country',
                    t.country,
                    'text',
                    undefined,
                    undefined,
                    t.countryHint,
                  )}
                  <div className="journey-form-grid">
                    {input(
                      'nationality',
                      `${t.nationality} · ${t.optional}`,
                      'text',
                      undefined,
                      undefined,
                      t.codeHint,
                    )}
                    {input(
                      'residency',
                      `${t.residency} · ${t.optional}`,
                      'text',
                      undefined,
                      undefined,
                      t.codeHint,
                    )}
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <Choices
                    name="studyLevel"
                    label={t.goals}
                    options={t.degrees}
                    value={draft.studyLevel}
                    onChange={(value) => update('studyLevel', value)}
                    emojis={['🌱', '🧩', '🎓', '🔬', '🔭']}
                    invalid={invalid.includes('studyLevel')}
                  />
                  <Choices
                    name="field"
                    label={t.field}
                    options={t.fields}
                    value={draft.field}
                    onChange={(value) => {
                      setCustomField(false);
                      update('field', value);
                    }}
                    emojis={fieldEmoji}
                    invalid={invalid.includes('field')}
                  />
                  <button
                    className="ui-button ui-button--ghost"
                    type="button"
                    aria-pressed={customField}
                    onClick={() => {
                      setCustomField(true);
                      update('field', '');
                    }}
                  >
                    {t.customField}
                  </button>
                  {(customField || invalid.includes('field')) &&
                    input(
                      'field',
                      t.customField,
                      'text',
                      undefined,
                      undefined,
                      t.fieldHint,
                    )}
                </>
              )}
              {step === 2 && (
                <>
                  <label className="ui-field" htmlFor="journey-educationLevel">
                    <span>
                      {t.education} · {t.optional}
                    </span>
                    <select
                      id="journey-educationLevel"
                      value={draft.educationLevel}
                      onChange={(e) => update('educationLevel', e.target.value)}
                    >
                      <option value="">{t.notProvided}</option>
                      {Object.entries(t.educations).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {input('graduationYear', t.graduation, 'number', 1950, 2200)}
                  <div className="journey-form-grid">
                    {input('gpa', t.gpa, 'number', 0, 100)}
                    {input('gpaScale', t.scale, 'number', 0.1, 100)}
                  </div>
                  <details className="journey-exams">
                    <summary>{t.exams}</summary>
                    <p className="journey-note">{t.examHint}</p>
                    <div className="journey-form-grid">
                      {(
                        [
                          'ielts',
                          'toefl',
                          'sat',
                          'act',
                          'hsk',
                          'topik',
                        ] as const
                      ).map((key) => (
                        <div key={key}>
                          {input(
                            key,
                            key.toUpperCase(),
                            'number',
                            key === 'sat' ? 400 : key === 'act' ? 1 : 0,
                            {
                              ielts: 9,
                              toefl: 120,
                              sat: 1600,
                              act: 36,
                              hsk: 300,
                              topik: 6,
                            }[key],
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                </>
              )}
              {step === 3 && (
                <div className="budget-experience">
                  <span aria-hidden="true" className="budget-emoji">
                    🌍
                  </span>
                  <label className="budget-output" htmlFor="journey-budget">
                    {format(draft.budget)}
                  </label>
                  <p>{t.budget}</p>
                  <div className="budget-presets">
                    {['0', '5000', '15000', '30000'].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        aria-pressed={draft.budget === amount}
                        onClick={() => update('budget', amount)}
                      >
                        {format(amount)}
                      </button>
                    ))}
                  </div>
                  <label className="ui-field" htmlFor="budget-slider">
                    <span>{t.budget}</span>
                    <input
                      id="budget-slider"
                      type="range"
                      min="0"
                      max={Math.max(100000, Number(draft.budget || 0))}
                      step="1"
                      value={Number(draft.budget || 0)}
                      aria-valuetext={format(draft.budget)}
                      onChange={(e) => update('budget', e.target.value)}
                    />
                  </label>
                  {input('budget', t.exactBudget, 'number', 0, 1000000)}
                  <button
                    className="ui-button ui-button--ghost"
                    type="button"
                    aria-pressed={draft.budget === ''}
                    onClick={() => update('budget', '')}
                  >
                    {t.unknownBudget}
                  </button>
                  <p className="journey-note">{t.budgetHint}</p>
                  {draft.budget === '0' && (
                    <p className="budget-zero-note">{t.zeroBudget}</p>
                  )}
                </div>
              )}
              {step === 4 && (
                <>
                  <div className="journey-review">
                    {[
                      [
                        t.steps[0],
                        `${t.grades[draft.grade as keyof typeof t.grades] ?? t.notProvided} · ${draft.country}`,
                        0,
                      ],
                      [
                        t.steps[1],
                        `${t.degrees[draft.studyLevel as keyof typeof t.degrees] ?? draft.studyLevel} · ${t.fields[draft.field as keyof typeof t.fields] ?? draft.field}`,
                        1,
                      ],
                      [
                        t.steps[2],
                        `${draft.graduationYear || t.notProvided} · ${draft.gpa && draft.gpaScale ? `${draft.gpa} / ${draft.gpaScale}` : t.notProvided}`,
                        2,
                      ],
                      [t.steps[3], format(draft.budget), 3],
                    ].map(([label, value, index]) => (
                      <div key={label}>
                        <span className="review-icon" aria-hidden="true">
                          {['🌱', '🎯', '📚', '🌍'][Number(index)]}
                        </span>
                        <div>
                          <h2>{label}</h2>
                          <p>{value}</p>
                        </div>
                        <button
                          type="button"
                          className="ui-button ui-button--ghost"
                          aria-label={`${t.edit}: ${label}`}
                          onClick={() => move(Number(index))}
                        >
                          {t.edit}
                        </button>
                      </div>
                    ))}
                  </div>
                  <details className="journey-exams">
                    <summary>{t.academics}</summary>
                    <dl className="review-details">
                      {[
                        [t.nationality, draft.nationality],
                        [t.residency, draft.residency],
                        [
                          t.education,
                          t.educations[
                            draft.educationLevel as keyof typeof t.educations
                          ] ?? draft.educationLevel,
                        ],
                        ...(
                          [
                            'ielts',
                            'toefl',
                            'sat',
                            'act',
                            'hsk',
                            'topik',
                          ] as const
                        ).map((key) => [key.toUpperCase(), draft[key]]),
                      ].map(([label, value]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{value || t.notProvided}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                  <button
                    className="ui-button ui-button--ghost"
                    type="button"
                    onClick={exportAnswers}
                  >
                    {t.export} ↓
                  </button>
                  <p className="journey-note">
                    {t.private}.{' '}
                    <a
                      href={`/${locale}/privacy`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t.privacyLink} <Icon name="arrow" />
                    </a>
                  </p>
                </>
              )}
            </div>
            <div className="journey-step-actions">
              {step > 0 && (
                <button
                  className="ui-button ui-button--secondary"
                  type="button"
                  onClick={() => move(step - 1)}
                >
                  {t.back}
                </button>
              )}
              {step === 2 && (
                <button
                  className="ui-button ui-button--ghost"
                  type="button"
                  onClick={() => {
                    if (validate(2)) move(3);
                  }}
                >
                  {t.skip}
                </button>
              )}
              <button
                key={step === 4 ? 'save' : 'continue'}
                className="ui-button ui-button--primary"
                type={step === 4 ? 'submit' : 'button'}
                onClick={
                  step === 4
                    ? undefined
                    : () => {
                        if (validate(step)) move(step + 1);
                      }
                }
                disabled={pending || loadFailed}
              >
                {pending ? t.saving : step === 4 ? t.save : t.next}
                <Icon name="arrow" />
              </button>
            </div>
          </fieldset>
        </form>
        <p className="journey-memory">{t.memory}</p>
      </div>
    </main>
  );
}
