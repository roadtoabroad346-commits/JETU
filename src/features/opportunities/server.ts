import 'server-only';
import { z } from 'zod';
import { getPublicEnv } from '@/lib/env/public';

export const opportunityKinds = [
  'olympiad',
  'hackathon',
  'summer_school',
  'research_school',
  'academic_competition',
  'exchange',
  'volunteering',
  'internship',
  'student_conference',
  'award',
  'essay_contest',
  'coding_contest',
  'mentorship',
  'portfolio_program',
  'gap_year',
  'high_school',
] as const;

export const opportunityFilters = z.object({
  q: z.string().trim().max(80).optional().default(''),
  kind: z
    .enum(['', ...opportunityKinds])
    .optional()
    .default(''),
  age: z
    .union([z.literal(''), z.coerce.number().int().min(5).max(35)])
    .optional()
    .default(''),
  grade: z
    .union([z.literal(''), z.coerce.number().int().min(1).max(13)])
    .optional()
    .default(''),
  page: z.coerce.number().int().min(1).max(200).optional().default(1),
});
export type OpportunityFilters = z.infer<typeof opportunityFilters>;
export type Opportunity = {
  id: number;
  slug: string;
  title: string;
  opportunity_type: string;
  provider_name: string | null;
  sponsor_name: string | null;
  summary: string | null;
  participation_format: 'online' | 'in_person' | 'hybrid' | 'unknown';
  country_code: string | null;
  location_text: string | null;
  cost_state: 'free' | 'paid' | 'fee_waiver_available' | 'unknown';
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
  age_fit: string;
  grade_fit: string;
  tags: string[];
  total_count: number;
};
export class OpportunityUnavailable extends Error {}

export function parseOpportunityFilters(
  input: Record<string, string | string[] | undefined>,
) {
  return opportunityFilters.safeParse(
    Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        key,
        Array.isArray(value) ? value[0] : value,
      ]),
    ),
  );
}

export async function opportunityRest<T>(
  path: string,
  init?: RequestInit,
  accessToken?: string,
): Promise<T> {
  const env = getPublicEnv();
  if (
    !env.NEXT_PUBLIC_SUPABASE_URL ||
    !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    throw new OpportunityUnavailable('Supabase is not configured');
  let response: Response;
  try {
    response = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
      headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new OpportunityUnavailable('Opportunity request failed');
  }
  if (!response.ok)
    throw new OpportunityUnavailable(
      `Opportunity request failed: ${response.status}`,
    );
  if (response.status === 204) return undefined as T;
  const body = await response.text();
  if (!body) return undefined as T;
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new OpportunityUnavailable('Opportunity response was invalid');
  }
}

export async function searchOpportunities(
  filters: OpportunityFilters,
  slug?: string,
) {
  return opportunityRest<Opportunity[]>('rpc/opportunity_search', {
    method: 'POST',
    body: JSON.stringify({
      p_filters: {
        q: filters.q || undefined,
        type: filters.kind || undefined,
        age: filters.age === '' ? undefined : filters.age,
        grade: filters.grade === '' ? undefined : filters.grade,
        slug: slug ?? undefined,
        offset: (filters.page - 1) * 12,
        limit: slug ? 1 : 12,
      },
    }),
  });
}

export const defaultOpportunityFilters = opportunityFilters.parse({});
