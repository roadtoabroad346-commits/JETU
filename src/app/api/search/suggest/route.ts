import { z } from 'zod';
import { isLocale } from '@/lib/i18n/messages';
import { errorResponse, successResponse } from '@/server/http';
import { SearchUnavailable, searchSuggestions } from '@/features/search/server';

const querySchema = z.object({
  q: z.string().trim().min(2).max(120),
  type: z.enum(['', 'program', 'scholarship', 'opportunity']).default(''),
  locale: z.string().refine(isLocale),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );
  if (!parsed.success) return errorResponse('VALIDATION_FAILED');
  try {
    const rows = await searchSuggestions(parsed.data.q, parsed.data.type);
    return successResponse({
      items: rows.map((row) => ({
        id: String(row.entity_id),
        title: row.title,
        subtitle: row.subtitle,
        type: row.entity_type,
        href: `/${parsed.data.locale}${row.detail_path}`,
      })),
    });
  } catch (error) {
    return errorResponse(
      error instanceof SearchUnavailable &&
        error.message === 'Search is not configured'
        ? 'PROVIDER_NOT_CONFIGURED'
        : 'INTERNAL_ERROR',
    );
  }
}
