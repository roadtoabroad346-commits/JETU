import {
  parseFilters,
  searchCatalog,
  CatalogUnavailable,
} from '@/features/catalog/server';
import { successResponse, errorResponse } from '@/server/http';
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = parseFilters(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) return errorResponse('VALIDATION_FAILED');
  try {
    return successResponse(await searchCatalog(parsed.data));
  } catch (error) {
    return errorResponse(
      error instanceof CatalogUnavailable &&
        error.message === 'Catalog is not configured'
        ? 'PROVIDER_NOT_CONFIGURED'
        : 'INTERNAL_ERROR',
    );
  }
}
