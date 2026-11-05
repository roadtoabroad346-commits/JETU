import { describe, expect, it } from 'vitest';
import {
  claimFingerprint,
  diffClaims,
  requestPolicy,
  retryDelayMs,
  validateNormalizedClaim,
  validateOfficialSourceAdapter,
  type NormalizedClaim,
  type OfficialSourceAdapter,
} from '@/features/ingestion/official-source';

const adapter: OfficialSourceAdapter = {
  key: 'ca-university-higher-ed',
  countryCodes: ['CA'],
  region: 'North America',
  educationSystems: ['higher_education'],
  allowedHosts: ['future.utoronto.ca'],
  maxRequestsPerMinute: 6,
  maxConcurrentRequests: 1,
  robotsPolicyReviewedAt: '2026-10-26T00:00:00Z',
  automatedFetchAllowed: true,
  parserVersion: 'v1',
};

const claim: NormalizedClaim = {
  naturalKey: 'ca:utoronto:computer-science',
  claimKey: 'program.title',
  value: 'Computer Science',
  sourceUrl: 'https://future.utoronto.ca/program/computer-science',
  observedAt: '2026-10-26T00:00:00Z',
  academicCycle: 2027,
  excerpt: 'Computer Science',
};

describe('official-source ingestion boundary', () => {
  it('requires explicit hosts, bounded rates and legal review', () => {
    expect(validateOfficialSourceAdapter(adapter)).toEqual([]);
    expect(
      requestPolicy({
        ...adapter,
        automatedFetchAllowed: true,
        robotsPolicyReviewedAt: null,
      }),
    ).toMatchObject({ allowed: false });
    expect(requestPolicy(adapter)).toMatchObject({
      allowed: true,
      minimumDelayMs: 10_000,
      maxConcurrentRequests: 1,
    });
  });

  it('rejects unapproved hosts and missing evidence', () => {
    expect(
      validateNormalizedClaim(
        { ...claim, sourceUrl: 'https://example.com/data', excerpt: '' },
        adapter,
      ),
    ).toEqual([
      'source host is outside the adapter allowlist',
      'a bounded evidence excerpt is required',
    ]);
  });

  it('uses deterministic fingerprints and sends changed values to review', () => {
    expect(claimFingerprint(claim)).toHaveLength(64);
    expect(diffClaims([claim], [claim])[0]?.disposition).toBe('unchanged');
    expect(
      diffClaims([claim], [{ ...claim, value: 'Computer Science BSc' }])[0]
        ?.disposition,
    ).toBe('needs_review');
  });

  it('caps exponential retry and honors retry-after', () => {
    expect(retryDelayMs(0, null, 0)).toBe(1000);
    expect(retryDelayMs(2, 10_000, 7)).toBe(10_007);
    expect(retryDelayMs(5, 120_000, 0)).toBe(60_000);
  });
});
