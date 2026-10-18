'use client';

import { motion, useReducedMotion } from 'motion/react';

export function LanguageLink({
  locale,
  label,
  current,
  path = '',
}: {
  locale: string;
  label: string;
  current: boolean;
  path?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.a
      className="language-link"
      href={`/${locale}${path}`}
      hrefLang={locale}
      lang={locale}
      aria-current={current ? 'page' : undefined}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.12 }}
    >
      {label}
    </motion.a>
  );
}
