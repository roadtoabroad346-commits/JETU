import 'server-only';
import { getPublicEnv } from '@/lib/env/public';

export type ScholarshipRow = {
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
  total_count: number;
};
export type CatalogResult<T> =
  { state: 'ready'; data: T } | { state: 'unavailable'; data: null };

async function publicFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const env = getPublicEnv();
  if (
    !env.NEXT_PUBLIC_SUPABASE_URL ||
    !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    throw new Error('Catalog is not configured');
  const response = await fetch(
    `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}`,
    {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
      headers: {
        apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    },
  );
  if (!response.ok) throw new Error('Catalog request failed');
  return response.json() as Promise<T>;
}

export async function listScholarships(input: {
  q?: string;
  page?: number;
  slug?: string;
  country?: string;
  awardType?: string;
  sort?: 'recent' | 'title' | 'deadline';
}): Promise<CatalogResult<ScholarshipRow[]>> {
  try {
    const data = await publicFetch<ScholarshipRow[]>('rpc/scholarship_search', {
      method: 'POST',
      body: JSON.stringify({
        p_query: (input.q ?? '').trim().slice(0, 80),
        p_limit: input.slug ? 1 : 20,
        p_offset: input.slug
          ? 0
          : (Math.max(1, Math.min(48, input.page ?? 1)) - 1) * 20,
        p_slug: input.slug ?? null,
        p_country: input.country ?? null,
        p_award_type: input.awardType ?? null,
        p_sort: input.sort ?? 'recent',
      }),
    });
    return { state: 'ready', data };
  } catch {
    return { state: 'unavailable', data: null };
  }
}

export type ScholarshipDetail = {
  row: ScholarshipRow;
  cycles: {
    id: number;
    academic_year_start: number;
    cycle_code: string;
    opens_at: string | null;
    closes_at: string | null;
  }[];
  benefits: {
    id: number;
    scholarship_cycle_id: number;
    coverage_item_code: string;
    description: string;
    coverage_percent: number | null;
  }[];
  limits: {
    scholarship_benefit_id: number;
    amount_min: number | null;
    amount_max: number | null;
    currency_code: string | null;
    limit_period: string;
    renewal_conditions: string | null;
  }[];
  funding: {
    funding_label: string;
    duration_note: string | null;
    renewal_conditions: string | null;
    uncovered_costs_note: string | null;
    annual_change_note: string | null;
  } | null;
  programs: { id: number; title: string; degree_level_code: string }[];
  requirements: {
    id: number;
    title: string;
    description: string;
    is_mandatory: boolean;
  }[];
  deadlines: {
    id: number;
    title: string;
    due_at: string | null;
    timezone_name: string | null;
    is_rolling: boolean;
  }[];
  documents: { document_name: string; requirement_state: string }[];
  application: {
    application_method: string;
    admissions_linkage: string;
    application_url: string | null;
    instructions: string | null;
  } | null;
};

const eq = (value: number) => `eq.${value}`;
export async function getScholarship(
  slug: string,
): Promise<CatalogResult<ScholarshipDetail | null>> {
  const base = await listScholarships({ slug });
  if (base.state === 'unavailable') return base;
  const row = base.data[0];
  if (!row) return { state: 'ready', data: null };
  try {
    const cycles = await publicFetch<ScholarshipDetail['cycles']>(
      `scholarship_cycles?scholarship_id=${eq(row.id)}&select=id,academic_year_start,cycle_code,opens_at,closes_at&limit=30`,
    );
    const cycleIds = cycles.map((cycle) => cycle.id);
    const ids = cycleIds.length ? `in.(${cycleIds.join(',')})` : 'in.(-1)';
    const [benefits, links, documents, application, funding, programLinks] =
      await Promise.all([
        publicFetch<ScholarshipDetail['benefits']>(
          `scholarship_benefits?scholarship_cycle_id=${ids}&select=id,scholarship_cycle_id,coverage_item_code,description,coverage_percent&limit=100`,
        ),
        publicFetch<
          {
            scholarship_cycle_id: number;
            eligibility_requirement_id?: number;
            deadline_id?: number;
          }[]
        >(
          `scholarship_eligibility_requirements?scholarship_cycle_id=${ids}&select=scholarship_cycle_id,eligibility_requirement_id&limit=100`,
        ),
        publicFetch<ScholarshipDetail['documents']>(
          `scholarship_document_requirements?scholarship_cycle_id=${ids}&select=document_name,requirement_state&limit=100`,
        ),
        publicFetch<NonNullable<ScholarshipDetail['application']>[]>(
          `scholarship_application_details?scholarship_id=${eq(row.id)}&select=application_method,admissions_linkage,application_url,instructions&limit=1`,
        ),
        publicFetch<NonNullable<ScholarshipDetail['funding']>[]>(
          `scholarship_funding_profiles?scholarship_id=${eq(row.id)}&select=funding_label,duration_note,renewal_conditions,uncovered_costs_note,annual_change_note&limit=1`,
        ),
        publicFetch<{ program_id: number }[]>(
          `scholarship_program_links?scholarship_cycle_id=${ids}&select=program_id&limit=100`,
        ),
      ]);
    const requirementIds = links
      .map((item) => item.eligibility_requirement_id)
      .filter((id): id is number => id !== undefined);
    const benefitIds = benefits.map((item) => item.id);
    const programIds = programLinks.map((item) => item.program_id);
    const [requirements, deadlineLinks, limits, programs] = await Promise.all([
      publicFetch<ScholarshipDetail['requirements']>(
        `eligibility_requirements?id=in.(${requirementIds.length ? requirementIds.join(',') : '-1'})&select=id,title,description,is_mandatory&limit=100`,
      ),
      publicFetch<{ deadline_id: number }[]>(
        `scholarship_cycle_deadlines?scholarship_cycle_id=${ids}&select=deadline_id&limit=100`,
      ),
      publicFetch<ScholarshipDetail['limits']>(
        `funding_limits?scholarship_benefit_id=in.(${benefitIds.length ? benefitIds.join(',') : '-1'})&select=scholarship_benefit_id,amount_min,amount_max,currency_code,limit_period,renewal_conditions&limit=100`,
      ),
      publicFetch<ScholarshipDetail['programs']>(
        `degree_programs?id=in.(${programIds.length ? programIds.join(',') : '-1'})&select=id,title,degree_level_code&limit=100`,
      ),
    ]);
    const deadlineIds = deadlineLinks.map((item) => item.deadline_id);
    const deadlines = await publicFetch<ScholarshipDetail['deadlines']>(
      `deadlines?id=in.(${deadlineIds.length ? deadlineIds.join(',') : '-1'})&select=id,title,due_at,timezone_name,is_rolling&limit=100`,
    );
    return {
      state: 'ready',
      data: {
        row,
        cycles,
        benefits,
        limits,
        funding: funding[0] ?? null,
        programs,
        requirements,
        deadlines,
        documents,
        application: application[0] ?? null,
      },
    };
  } catch {
    return { state: 'unavailable', data: null };
  }
}
