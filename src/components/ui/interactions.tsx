'use client';

import { useId, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from './primitives';
import { Icon } from './icon';

export function Dialog({
  trigger,
  title,
  description,
  closeLabel,
  children,
}: {
  trigger: string;
  title: string;
  description: string;
  closeLabel: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const close = () => ref.current?.close();
  return (
    <>
      <Button
        variant="secondary"
        onClick={() => ref.current?.showModal()}
        aria-haspopup="dialog"
      >
        {trigger}
      </Button>
      <dialog
        ref={ref}
        className="ui-dialog"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          const nodes = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
            ),
          ).filter(
            (node) => node.getClientRects().length > 0 && node.tabIndex >= 0,
          );
          const first = nodes[0];
          const last = nodes.at(-1);
          if (!first || !last) {
            event.preventDefault();
            return;
          }
          if (
            event.shiftKey &&
            (document.activeElement === first ||
              document.activeElement === event.currentTarget)
          ) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <div className="dialog-header">
          <h2 id={titleId}>{title}</h2>
          <Button variant="ghost" onClick={close} aria-label={closeLabel}>
            <Icon name="close" />
          </Button>
        </div>
        <p id={descriptionId} className="muted">
          {description}
        </p>
        {children}
      </dialog>
    </>
  );
}

export function Tabs({
  items,
  label,
}: {
  label: string;
  items: { id: string; label: string; content: ReactNode }[];
}) {
  const [selected, setSelected] = useState(0);
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const reduce = useReducedMotion();
  return (
    <div className="ui-tabs">
      <div role="tablist" aria-label={label}>
        {items.map((item, index) => (
          <button
            type="button"
            role="tab"
            key={item.id}
            id={`${id}-tab-${item.id}`}
            aria-controls={`${id}-panel-${item.id}`}
            aria-selected={selected === index}
            tabIndex={selected === index ? 0 : -1}
            ref={(node) => {
              refs.current[index] = node;
            }}
            onClick={() => setSelected(index)}
            onKeyDown={(event) => {
              let next: number;
              if (event.key === 'ArrowRight') next = (index + 1) % items.length;
              else if (event.key === 'ArrowLeft')
                next = (index - 1 + items.length) % items.length;
              else if (event.key === 'Home') next = 0;
              else if (event.key === 'End') next = items.length - 1;
              else return;
              event.preventDefault();
              setSelected(next);
              refs.current[next]?.focus();
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item, index) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${id}-panel-${item.id}`}
          aria-labelledby={`${id}-tab-${item.id}`}
          hidden={selected !== index}
          tabIndex={0}
        >
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: reduce ? 0 : 0.16 }}
          >
            {item.content}
          </motion.div>
        </div>
      ))}
    </div>
  );
}

export function Tooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span
      className="ui-tooltip"
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
    >
      <button
        className="tooltip-trigger"
        type="button"
        aria-describedby={open ? id : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation();
            setOpen(false);
          }
        }}
      >
        {children}
        <Icon name="info" />
      </button>
      {open && (
        <span role="tooltip" id={id}>
          {label}
        </span>
      )}
    </span>
  );
}

export function Stepper({
  steps,
  label,
}: {
  label: string;
  steps: { title: string; description: string }[];
}) {
  const [current, setCurrent] = useState(0);
  return (
    <div className="ui-stepper">
      <ol aria-label={label}>
        {steps.map((step, index) => (
          <li key={step.title}>
            <button
              type="button"
              aria-current={current === index ? 'step' : undefined}
              onClick={() => setCurrent(index)}
            >
              <span aria-hidden="true">{index + 1}</span>
              {step.title}
            </button>
          </li>
        ))}
      </ol>
      <p role="status">{steps[current]?.description}</p>
    </div>
  );
}
