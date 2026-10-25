import { createRequestSupabaseClient } from '@/lib/supabase/request';
import { errorResponse, successResponse } from '@/server/http';
import {
  preferencesSchema,
  recommend,
  RULES_VERSION,
} from '@/features/matching/engine';
import {
  loadCandidatesWithin,
  loadMatchingState,
  MatchingProfileMissing,
  MatchingTimeout,
  MatchingUnavailable,
  runMatching,
} from '@/features/matching/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const client = await createRequestSupabaseClient();
    const { data } = await client.auth.getUser();
    if (!data.user) return errorResponse('UNAUTHENTICATED');
    const state = await loadMatchingState(client, data.user.id);
    const { data: run, error } = await client
      .from('matching_runs')
      .select(
        'id,created_at,profile_version,rules_version,candidate_count,preferences_snapshot',
      )
      .eq('user_id', data.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new MatchingUnavailable();
    if (
      !run ||
      run.profile_version !== state.profileVersion ||
      run.rules_version !== RULES_VERSION
    )
      return successResponse({ state, run: null, results: [] });
    const snapshot = preferencesSchema.safeParse(run.preferences_snapshot);
    if (!snapshot.success)
      return successResponse({ state, run: null, results: [] });
    const { count, error: countError } = await client
      .from('matching_results')
      .select('entity_id', { count: 'exact', head: true })
      .eq('run_id', run.id)
      .eq('user_id', data.user.id);
    if (countError) throw new MatchingUnavailable();
    if (count !== run.candidate_count)
      return successResponse({ state, run: null, results: [] });
    const candidates = await loadCandidatesWithin(
      client,
      snapshot.data.enrollmentYear,
    );
    return successResponse({
      state: { ...state, preferences: snapshot.data },
      run,
      results: recommend(
        candidates,
        state.profile,
        snapshot.data,
        new Date().toISOString(),
      ),
    });
  } catch (error) {
    if (error instanceof MatchingTimeout)
      return errorResponse('PROVIDER_TIMEOUT');
    return errorResponse('INTERNAL_ERROR');
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  let sameOrigin = false;
  try {
    sameOrigin = Boolean(
      origin && new URL(origin).host === request.headers.get('host'),
    );
  } catch {
    /* malformed Origin fails closed */
  }
  if (!sameOrigin) return errorResponse('FORBIDDEN');
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return errorResponse('VALIDATION_FAILED');
  if (Number(request.headers.get('content-length') ?? 0) > 4096)
    return errorResponse('VALIDATION_FAILED');
  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 4096)
      return errorResponse('VALIDATION_FAILED');
    body = JSON.parse(raw);
  } catch {
    return errorResponse('VALIDATION_FAILED');
  }
  const parsed = preferencesSchema.safeParse(body);
  if (!parsed.success)
    return errorResponse(
      'VALIDATION_FAILED',
      parsed.error.flatten().fieldErrors,
    );
  try {
    const client = await createRequestSupabaseClient();
    const { data } = await client.auth.getUser();
    if (!data.user) return errorResponse('UNAUTHENTICATED');
    const result = await runMatching(client, data.user.id, parsed.data);
    if (result.rateLimited) return errorResponse('RATE_LIMITED');
    return successResponse(result);
  } catch (error) {
    if (error instanceof MatchingTimeout)
      return errorResponse('PROVIDER_TIMEOUT');
    if (error instanceof MatchingProfileMissing)
      return errorResponse('VALIDATION_FAILED', {
        profile: ['Complete your profile before matching.'],
      });
    if (error instanceof MatchingUnavailable)
      return errorResponse('INTERNAL_ERROR');
    return errorResponse('INTERNAL_ERROR');
  }
}
