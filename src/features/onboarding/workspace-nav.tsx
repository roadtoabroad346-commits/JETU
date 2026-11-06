'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/ui/icon';

export function WorkspaceNav({
  label,
  items,
}: {
  label: string;
  items: {
    href: string;
    label: string;
    count?: number | null;
    icon: 'book' | 'search' | 'check' | 'arrow' | 'calendar' | 'bell';
  }[];
}) {
  const pathname = usePathname();
  const [unread, setUnread] = useState<number | null>(null);
  useEffect(() => {
    const listener = (event: Event) => {
      const n = (event as CustomEvent<unknown>).detail;
      if (typeof n === 'number' && Number.isInteger(n) && n >= 0) setUnread(n);
    };
    window.addEventListener('jetu:unread', listener);
    return () => window.removeEventListener('jetu:unread', listener);
  }, []);
  return (
    <nav aria-label={label} className="dashboard-nav student-workspace-nav">
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          aria-current={pathname === item.href ? 'page' : undefined}
        >
          <Icon name={item.icon} />
          {item.label}
          {item.icon === 'bell' && (unread ?? item.count) != null
            ? ` (${unread ?? item.count})`
            : ''}
        </a>
      ))}
    </nav>
  );
}
