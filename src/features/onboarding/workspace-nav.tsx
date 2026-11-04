'use client';
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
    icon: 'book' | 'search' | 'check' | 'arrow';
  }[];
}) {
  const pathname = usePathname();
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
        </a>
      ))}
    </nav>
  );
}
