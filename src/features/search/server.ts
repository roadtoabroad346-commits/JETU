import 'server-only';

import { z } from 'zod';
import { getPublicEnv } from '@/lib/env/public';

const optionalText = (max = 80) =>
  z.string().trim().max(max).optional().default('');

export const searchFiltersSchema = z.object({
  q: optionalText(120),
  type: z
    .enum(['', 'program', 'scholarship', 'opportunity'])
    .optional()
    .default(''),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^$|^[A-Z]{2}$/)
    .optional()
    .default(''),
  level: z
    .enum(['', 'bachelor', 'master', 'associate', 'foundation', 'doctorate'])
    .optional()
    .default(''),
  category: optionalText(80),
  format: z
    .enum(['', 'on_campus', 'online', 'in_person', 'hybrid', 'unknown'])
    .optional()
    .default(''),
  funding: z
    .enum([
      '',
      'unknown',
      'partial',
      'full_tuition',
      'tuition_stipend',
      'comprehensive',
    ])
    .optional()
    .default(''),
  cost: z
    .enum(['', 'unknown', 'free', 'paid', 'fee_waiver_available'])
    .optional()
    .default(''),
  deadline: z
    .union([z.literal(''), z.iso.date()])
    .optional()
    .default(''),
  sort: z
    .enum(['relevance', 'recent', 'deadline', 'title'])
    .optional()
    .default('relevance'),
  page: z.coerce.number().int().min(1).max(241).optional().default(1),
  compare: optionalText(120),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;
export type SearchEntityType = 'program' | 'scholarship' | 'opportunity';

export type UnifiedSearchRow = {
  entity_type: SearchEntityType;
  entity_id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  country_code: string | null;
  degree_level: string | null;
  category: string | null;
  delivery_format: string | null;
  cost_state: string;
  cost_amount_min: number | null;
  cost_amount_max: number | null;
  cost_currency: string | null;
  cost_period: string | null;
  deadline_at: string | null;
  funding_label: string | null;
  has_funding: boolean;
  source_url: string;
  source_checked_at: string;
  source_freshness: 'current' | 'stale';
  eligibility_state: 'not_evaluated';
  detail_path: string;
  relevance: number;
  total_count: number;
  type_counts: Record<SearchEntityType, number>;
};

export type ScholarshipDetail = {
  id: number;
  slug: string;
  title: string;
  award_type: string;
  provider_name: string | null;
  provider_country_code: string | null;
  official_url: string;
  source_url: string;
  source_checked_at: string;
  deadline_at: string | null;
  deadline_timezone: string | null;
  benefit_summary: string | null;
};

export type OpportunityDetail = {
  id: number;
  slug: string;
  title: string;
  opportunity_type: string;
  provider_name: string | null;
  sponsor_name: string | null;
  summary: string | null;
  participation_format: string;
  country_code: string | null;
  location_text: string | null;
  cost_state: string;
  cost_amount_min: number | null;
  cost_amount_max: number | null;
  cost_currency_code: string | null;
  eligibility_age_min: number | null;
  eligibility_age_max: number | null;
  eligibility_grade_min: number | null;
  eligibility_grade_max: number | null;
  eligibility_summary: string | null;
  official_application_url: string | null;
  risk_summary: string | null;
  starts_on: string | null;
  ends_on: string | null;
  deadline_at: string | null;
  deadline_timezone: string | null;
  source_url: string;
  source_checked_at: string;
  tags: string[];
};

export type ProgramRequirement = {
  title: string;
  description: string;
  isMandatory: boolean;
};

export type ProgramComparison = UnifiedSearchRow & {
  languages: string[];
  formats: string[];
  requirements: ProgramRequirement[];
};

export class SearchUnavailable extends Error {}

export function parseSearchFilters(
  input: Record<string, string | string[] | undefined>,
) {
  return searchFiltersSchema.safeParse(
    Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        key,
        Array.isArray(value) ? value[0] : value,
      ]),
    ),
  );
}

export function parseCompareIds(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return [];
  const parts = raw.split(',');
  if (parts.length > 4 || parts.some((part) => !/^[1-9][0-9]*$/.test(part)))
    return null;
  const ids = [...new Set(parts.map(Number))];
  return ids.length === parts.length ? ids : null;
}

async function publicFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const env = getPublicEnv();
  if (
    !env.NEXT_PUBLIC_SUPABASE_URL ||
    !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    throw new SearchUnavailable('Search is not configured');
  }
  let response: Response;
  try {
    response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
      headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  } catch {
    throw new SearchUnavailable('Search request failed');
  }
  if (!response.ok) throw new SearchUnavailable('Search request failed');
  return response.json() as Promise<T>;
}

async function rpc<T>(name: string, body: Record<string, unknown>): Promise<T> {
  return publicFetch<T>(`rpc/${name}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

async function table<T>(name: string, query: string) {
  return publicFetch<T[]>(`${name}?${query}`);
}

function rpcFilters(filters: SearchFilters) {
  const values = Object.fromEntries(
    Object.entries(filters).filter(
      ([key]) => key !== 'page' && key !== 'compare',
    ),
  );
  return { ...values, limit: 20, offset: (filters.page - 1) * 20 };
}

export async function searchUnified(filters: SearchFilters) {
  return rpc<UnifiedSearchRow[]>('unified_catalog_search', {
    p_filters: rpcFilters(filters),
  });
}

export async function searchSuggestions(
  query: string,
  type: SearchEntityType | '',
) {
  return rpc<UnifiedSearchRow[]>('unified_catalog_search', {
    p_filters: { q: query, type, sort: 'relevance', limit: 8, offset: 0 },
  });
}

export async function getScholarshipDetail(slug: string) {
  const rows = await rpc<ScholarshipDetail[]>('scholarship_search', {
    p_query: '',
    p_limit: 1,
    p_offset: 0,
    p_slug: slug,
    p_country: null,
    p_award_type: null,
    p_sort: 'recent',
  });
  return rows[0] ?? null;
}

export async function getOpportunityDetail(slug: string) {
  const rows = await rpc<OpportunityDetail[]>('opportunity_search', {
    p_filters: { slug, limit: 1, offset: 0, sort: 'recent' },
  });
  return rows[0] ?? null;
}

export async function getProgramComparison(
  ids: number[],
): Promise<ProgramComparison[]> {
  if (ids.length < 2 || ids.length > 4) return [];
  const base = await rpc<UnifiedSearchRow[]>('unified_catalog_search', {
    p_filters: { type: 'program', ids, sort: 'title', limit: 4, offset: 0 },
  });
  const idList = ids.join(',');
  const [languages, formats, requirementLinks] = await Promise.all([
    table<{ program_id: number; language_code: string }>(
      'degree_program_languages',
      `program_id=in.(${idList})&select=program_id,language_code&order=language_code.asc&limit=100`,
    ),
    table<{ program_id: number; delivery_mode_code: string }>(
      'degree_program_delivery_modes',
      `program_id=in.(${idList})&select=program_id,delivery_mode_code&order=delivery_mode_code.asc&limit=100`,
    ),
    table<{ program_id: number; eligibility_requirement_id: number }>(
      'program_eligibility_requirements',
      `program_id=in.(${idList})&select=program_id,eligibility_requirement_id&limit=200`,
    ),
  ]);
  const requirementIds = [
    ...new Set(requirementLinks.map((item) => item.eligibility_requirement_id)),
  ];
  const requirements = requirementIds.length
    ? await table<{
        id: number;
        title: string;
        description: string;
        is_mandatory: boolean;
      }>(
        'eligibility_requirements',
        `id=in.(${requirementIds.join(',')})&select=id,title,description,is_mandatory&order=title.asc&limit=200`,
      )
    : [];
  const requirementById = new Map(requirements.map((item) => [item.id, item]));
  const byId = new Map(base.map((row) => [row.entity_id, row]));
  return ids.flatMap((id) => {
    const row = byId.get(id);
    if (!row) return [];
    return [
      {
        ...row,
        languages: languages
          .filter((item) => item.program_id === id)
          .map((item) => item.language_code),
        formats: formats
          .filter((item) => item.program_id === id)
          .map((item) => item.delivery_mode_code),
        requirements: requirementLinks
          .filter((item) => item.program_id === id)
          .flatMap((item) => {
            const requirement = requirementById.get(
              item.eligibility_requirement_id,
            );
            return requirement
              ? [
                  {
                    title: requirement.title,
                    description: requirement.description,
                    isMandatory: requirement.is_mandatory,
                  },
                ]
              : [];
          }),
      },
    ];
  });
}
