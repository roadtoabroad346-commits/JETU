'use client';

// Keep the same wrapper during hydration so form inputs are never remounted.
// Server HTML is fully visible; the finite entrance starts after hydration.
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
  return (
    <motion.div
      className={className}
      initial={false}
      animate={
        interactive && !reduce
          ? { opacity: [0.7, 1], y: [y, 0] }
          : { opacity: 1, y: 0 }
      }
      transition={{ duration: reduce ? 0 : 0.24, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
