import { createHash } from 'node:crypto';

export type EducationSystem =
  | 'higher_education'
  | 'secondary_education'
  | 'scholarship_provider'
  | 'government_registry';

export type OfficialSourceAdapter = {
  key: string;
  countryCodes: string[];
  region: string;
  educationSystems: EducationSystem[];
  allowedHosts: string[];
  maxRequestsPerMinute: number;
  maxConcurrentRequests: number;
  robotsPolicyReviewedAt: string | null;
  automatedFetchAllowed: boolean;
  parserVersion: string;
};

export type NormalizedClaim = {
  naturalKey: string;
  claimKey: string;
  value: string;
  sourceUrl: string;
  observedAt: string;
  academicCycle: number | null;
  excerpt: string;
};

export function validateOfficialSourceAdapter(adapter: OfficialSourceAdapter) {
  const problems: string[] = [];
  if (!/^[a-z0-9][a-z0-9._-]{2,79}$/.test(adapter.key))
    problems.push('invalid adapter key');
  if (!adapter.countryCodes.length)
    problems.push('at least one country is required');
  if (adapter.countryCodes.some((code) => !/^[A-Z]{2}$/.test(code)))
    problems.push('country codes must be ISO 3166-1 alpha-2');
  if (!adapter.educationSystems.length)
    problems.push('at least one education system is required');
  if (
    !adapter.allowedHosts.length ||
    adapter.allowedHosts.some(
      (host) =>
        !/^[a-z0-9.-]+$/.test(host) ||
        host.startsWith('.') ||
        host.endsWith('.'),
    )
  )
    problems.push('allowed hosts must be explicit hostnames');
  if (
    !Number.isInteger(adapter.maxRequestsPerMinute) ||
    adapter.maxRequestsPerMinute < 1 ||
    adapter.maxRequestsPerMinute > 60
  )
    problems.push('request rate must be between 1 and 60 per minute');
  if (
    !Number.isInteger(adapter.maxConcurrentRequests) ||
    adapter.maxConcurrentRequests < 1 ||
    adapter.maxConcurrentRequests > 4
  )
    problems.push('concurrency must be between 1 and 4');
  if (adapter.automatedFetchAllowed && !adapter.robotsPolicyReviewedAt)
    problems.push('automated fetch requires a recorded robots/terms review');
  return problems;
}

export function requestPolicy(adapter: OfficialSourceAdapter) {
  const problems = validateOfficialSourceAdapter(adapter);
  return {
    allowed: problems.length === 0 && adapter.automatedFetchAllowed,
    problems,
    minimumDelayMs: Math.ceil(60_000 / adapter.maxRequestsPerMinute),
    maxConcurrentRequests: adapter.maxConcurrentRequests,
    retryStatusCodes: [429, 500, 502, 503, 504] as const,
  };
}

export function retryDelayMs(
  attempt: number,
  retryAfterMs: number | null,
  seed: number,
) {
  if (!Number.isInteger(attempt) || attempt < 0 || attempt > 5)
    throw new RangeError('attempt must be between 0 and 5');
  const jitter = Math.abs(seed % 251);
  return (
    Math.min(60_000, Math.max(retryAfterMs ?? 0, 1000 * 2 ** attempt)) + jitter
  );
}

export function claimFingerprint(claim: NormalizedClaim) {
  return createHash('sha256')
    .update(
      JSON.stringify([
        claim.naturalKey,
        claim.claimKey,
        claim.value,
        claim.sourceUrl,
        claim.academicCycle,
      ]),
      'utf8',
    )
    .digest('hex');
}

export function validateNormalizedClaim(
  claim: NormalizedClaim,
  adapter: OfficialSourceAdapter,
) {
  const problems: string[] = [];
  let url: URL | null = null;
  try {
    url = new URL(claim.sourceUrl);
  } catch {
    problems.push('source URL is invalid');
  }
  if (url?.protocol !== 'https:') problems.push('source URL must use HTTPS');
  if (url && !adapter.allowedHosts.includes(url.hostname))
    problems.push('source host is outside the adapter allowlist');
  if (!claim.naturalKey.trim()) problems.push('natural key is required');
  if (!/^[a-z][a-z0-9_.-]*$/.test(claim.claimKey))
    problems.push('claim key is invalid');
  if (!claim.value.trim()) problems.push('claim value is required');
  if (!claim.excerpt.trim() || claim.excerpt.length > 4000)
    problems.push('a bounded evidence excerpt is required');
  if (!Number.isFinite(Date.parse(claim.observedAt)))
    problems.push('observation timestamp is invalid');
  if (
    claim.academicCycle !== null &&
    (!Number.isInteger(claim.academicCycle) ||
      claim.academicCycle < 2000 ||
      claim.academicCycle > 2200)
  )
    problems.push('academic cycle is invalid');
  return problems;
}

export function diffClaims(
  previous: NormalizedClaim[],
  incoming: NormalizedClaim[],
) {
  const oldByIdentity = new Map(
    previous.map((claim) => [
      `${claim.naturalKey}:${claim.claimKey}:${claim.academicCycle ?? 'none'}`,
      claimFingerprint(claim),
    ]),
  );
  return incoming.map((claim) => {
    const identity = `${claim.naturalKey}:${claim.claimKey}:${claim.academicCycle ?? 'none'}`;
    const fingerprint = claimFingerprint(claim);
    const previousFingerprint = oldByIdentity.get(identity);
    return {
      claim,
      fingerprint,
      disposition: !previousFingerprint
        ? ('new' as const)
        : previousFingerprint === fingerprint
          ? ('unchanged' as const)
          : ('needs_review' as const),
    };
  });
}
