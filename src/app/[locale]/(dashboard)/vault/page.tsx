import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/messages';
import { VaultWorkspace } from '@/features/vault/workspace';
import { vaultCopy } from '@/features/vault/copy';
export const dynamic = 'force-dynamic';
export async function generateMetadata({
  params,
}: PageProps<'/[locale]/vault'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return {
    title: vaultCopy(locale).vault,
    robots: { index: false, follow: false },
    referrer: 'no-referrer' as const,
  };
}
export default async function VaultPage({
  params,
}: PageProps<'/[locale]/vault'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <VaultWorkspace locale={locale} />;
}
