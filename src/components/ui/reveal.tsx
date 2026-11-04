'use client';

// Mount-gated entrance wrapper (same contract as the design-system Showcase):
// server HTML renders a plain div, and the motion fade-in starts only after
// hydration, so no-JS users always get fully visible markup and there is no
// style flash. Transform/opacity only — matches the layout-CLS discipline.
import { motion, useReducedMotion } from 'motion/react';
import { useSyncExternalStore, type ReactNode } from 'react';

const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export function Reveal({
  children,
  className,
  y = 10,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  const interactive = useSyncExternalStore(
    subscribeToHydration,
    clientReady,
    serverReady,
  );
  const reduce = useReducedMotion();
  if (!interactive || reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
