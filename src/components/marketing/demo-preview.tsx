'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Locale } from '@/lib/i18n/messages';
import { marketing } from '@/lib/i18n/marketing';
import { Icon } from '@/components/ui/icon';

export function DemoPreview({ locale }: { locale: Locale }) {
  const t = marketing[locale];
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [active, setActive] = useState<0 | 1>(0);
  const reduce = useReducedMotion();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const labels = [t.matching, t.essay];
  const onKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let next: 0 | 1 | null = null;
    if (event.key === 'ArrowRight') next = ((index + 1) % 2) as 0 | 1;
    if (event.key === 'ArrowLeft') next = ((index + 1) % 2) as 0 | 1;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = 1;
    if (next !== null) {
      event.preventDefault();
      setActive(next);
      tabs.current[next]?.focus();
    }
  };
  return (
    <div className="demo-window" aria-label={t.demo}>
      <div className="demo-topline">
        <span className="demo-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>JETU / {t.demo}</span>
      </div>
      <div className="demo-inner">
        <p className="demo-label">{t.demo}</p>
        <div className="demo-tabs" role="tablist" aria-label={t.demo}>
          {labels.map((label, index) => (
            <button
              key={label}
              ref={(node) => {
                tabs.current[index] = node;
              }}
              id={`demo-tab-${index}`}
              type="button"
              role="tab"
              aria-controls={`demo-panel-${index}`}
              aria-selected={active === index}
              tabIndex={active === index ? 0 : -1}
              disabled={!mounted}
              onClick={() => setActive(index as 0 | 1)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              {label}
            </button>
          ))}
        </div>
        {labels.map((label, index) => (
          <motion.div
            key={label}
            id={`demo-panel-${index}`}
            role="tabpanel"
            aria-labelledby={`demo-tab-${index}`}
            tabIndex={active === index ? 0 : -1}
            hidden={active !== index}
            className="demo-panel"
            initial={false}
            animate={
              reduce
                ? undefined
                : {
                    opacity: active === index ? 1 : 0,
                    y: active === index ? 0 : 8,
                  }
            }
            transition={{ duration: 0.2 }}
          >
            <span className="demo-panel-symbol" aria-hidden="true">
              <Icon name={index === 0 ? 'arrow' : 'book'} />
            </span>
            <div>
              <h2>{index === 0 ? t.previewMatch : t.previewEssay}</h2>
              <p>{index === 0 ? t.previewMatchBody : t.previewEssayBody}</p>
            </div>
          </motion.div>
        ))}
        <p className="demo-disclaimer">{t.demoNote}</p>
      </div>
    </div>
  );
}
