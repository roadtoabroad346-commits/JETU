import 'server-only';
import { z } from 'zod';
import { opportunityRest } from '@/features/opportunities/server';

export const schoolPage = z.coerce.number().int().min(1).max(200).default(1);

type Profile = {
  institution_id: number;
  school_kind: string;
  partnership_state: string;
  source_claim_id: number;
};
type Institution = {
  id: number;
  legal_name: string;
  institution_type: string;
  website_url: string | null;
};
type Claim = { id: number; source_id: number; observed_at: string };
type Source = { id: number; canonical_url: string; last_checked_at: string };
export type School = {
  id: number;
  name: string;
  kind: string;
  verifiedPartner: boolean;
  website: string | null;
  sourceUrl: string;
  checkedAt: string;
};

/** Public RLS hides unpublished institutions and unverified or inactive evidence. */
export async function listSchools(
  page: number,
): Promise<{ schools: School[]; hasNext: boolean }> {
  const pageSize = 12;
  const profiles = await opportunityRest<Profile[]>(
    `institution_school_profiles?select=institution_id,school_kind,partnership_state,source_claim_id&order=institution_id.asc&limit=${pageSize + 1}&offset=${(page - 1) * pageSize}`,
  );
  if (profiles.length === 0) return { schools: [], hasNext: false };
  const visiblePage = profiles.slice(0, pageSize);
  const institutionIds = visiblePage.map((row) => row.institution_id).join(',');
  const claimIds = visiblePage.map((row) => row.source_claim_id).join(',');
  const [institutions, claims] = await Promise.all([
    opportunityRest<Institution[]>(
      `institutions?id=in.(${institutionIds})&select=id,legal_name,institution_type,website_url`,
    ),
    opportunityRest<Claim[]>(
      `source_claims?id=in.(${claimIds})&select=id,source_id,observed_at`,
    ),
  ]);
  if (claims.length === 0)
    return { schools: [], hasNext: profiles.length > pageSize };
  const sourceIds = [...new Set(claims.map((row) => row.source_id))].join(',');
  const sources = await opportunityRest<Source[]>(
    `official_sources?id=in.(${sourceIds})&select=id,canonical_url,last_checked_at`,
  );
  const schools = visiblePage.flatMap((profile) => {
    const institution = institutions.find(
      (item) => item.id === profile.institution_id,
    );
    const claim = claims.find((item) => item.id === profile.source_claim_id);
    const source = sources.find((item) => item.id === claim?.source_id);
    if (
      !institution ||
      !['school', 'other'].includes(institution.institution_type) ||
      !claim ||
      !source ||
      Date.parse(source.last_checked_at) <
        Date.now() - 180 * 24 * 60 * 60 * 1000
    )
      return [];
    return [
      {
        id: institution.id,
        name: institution.legal_name,
        kind: profile.school_kind,
        verifiedPartner: profile.partnership_state === 'verified_partner',
        website: institution.website_url,
        sourceUrl: source.canonical_url,
        checkedAt: source.last_checked_at,
      },
    ];
  });
  return { schools, hasNext: profiles.length > pageSize };
}
