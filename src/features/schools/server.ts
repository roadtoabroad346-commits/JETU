import 'server-only';
import { opportunityRest } from '@/features/opportunities/server';

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
export async function listSchools(): Promise<School[]> {
  const profiles = await opportunityRest<Profile[]>(
    'institution_school_profiles?select=institution_id,school_kind,partnership_state,source_claim_id&order=institution_id.asc&limit=24',
  );
  if (profiles.length === 0) return [];
  const institutionIds = profiles.map((row) => row.institution_id).join(',');
  const claimIds = profiles.map((row) => row.source_claim_id).join(',');
  const [institutions, claims] = await Promise.all([
    opportunityRest<Institution[]>(
      `institutions?id=in.(${institutionIds})&select=id,legal_name,institution_type,website_url`,
    ),
    opportunityRest<Claim[]>(
      `source_claims?id=in.(${claimIds})&select=id,source_id,observed_at`,
    ),
  ]);
  if (claims.length === 0) return [];
  const sourceIds = [...new Set(claims.map((row) => row.source_id))].join(',');
  const sources = await opportunityRest<Source[]>(
    `official_sources?id=in.(${sourceIds})&select=id,canonical_url,last_checked_at`,
  );
  return profiles.flatMap((profile) => {
    const institution = institutions.find(
      (item) => item.id === profile.institution_id,
    );
    const claim = claims.find((item) => item.id === profile.source_claim_id);
    const source = sources.find((item) => item.id === claim?.source_id);
    if (
      !institution ||
      !['school', 'other'].includes(institution.institution_type) ||
      !claim ||
      !source
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
}
