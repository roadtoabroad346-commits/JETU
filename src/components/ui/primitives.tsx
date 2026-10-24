import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';

export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';
export function Button({
  variant = 'primary',
  pending = false,
  state = 'idle',
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost';
  pending?: boolean;
  state?: 'idle' | 'success' | 'error';
}) {
  return (
    <button
      {...props}
      type={type}
      className={`ui-button ui-button--${variant} ${className}`}
      data-state={pending ? 'loading' : state}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
    >
      {pending && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return <span className={`ui-badge ui-badge--${tone}`}>{children}</span>;
}
export function Card({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`ui-card ${className}`} />;
}
export function Field({
  label,
  hint,
  error,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="ui-field">
      <label htmlFor={id}>
        {label}
        {props.required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [hint && `${id}-hint`, error && `${id}-error`]
            .filter(Boolean)
            .join(' ') || undefined
        }
      />
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
export function Select({
  label,
  children,
  id,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { id: string; label: string }) {
  return (
    <div className="ui-field">
      <label htmlFor={id}>{label}</label>
      <select {...props} id={id}>
        {children}
      </select>
    </div>
  );
}
export function Progress({ value, label }: { value: number; label: string }) {
  const safeValue = Math.min(
    100,
    Math.max(0, Number.isFinite(value) ? value : 0),
  );
  return (
    <div className="ui-progress">
      <div className="row spread">
        <span>{label}</span>
        <span className="tabular">{safeValue}%</span>
      </div>
      <progress max={100} value={safeValue} aria-label={label} />
    </div>
  );
}
export function Skeleton({ label }: { label: string }) {
  return (
    <div role="status" className="ui-skeleton">
      <span className="sr-only">{label}</span>
      <span />
      <span />
      <span />
    </div>
  );
}
export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="ui-empty">
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function Timeline({
  items,
  label,
}: {
  items: { title: string; description: string }[];
  label: string;
}) {
  return (
    <ol className="ui-timeline" aria-label={label}>
      {items.map((item, index) => (
        <li key={item.title}>
          <span className="timeline-dot" aria-hidden="true">
            {index + 1}
          </span>
          <div>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
export function Sidebar({
  items,
  label,
}: {
  label: string;
  items: { id: string; label: string }[];
}) {
  return (
    <nav className="ui-sidebar" aria-label={label}>
      {items.map((item, i) => (
        <a key={item.id} href={`#${item.id}`}>
          <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
          {item.label}
        </a>
      ))}
    </nav>
  );
}
