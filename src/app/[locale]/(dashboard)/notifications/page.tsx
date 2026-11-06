import type { Metadata } from 'next';
import { DeadlinePage } from '@/features/deadlines/page';
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default function Page(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <DeadlinePage {...props} section="inbox" />;
}
