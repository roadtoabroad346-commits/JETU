import 'server-only';
import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import {
  generateRoadmap,
  normalizeOfficialDeadline,
  ROADMAP_GENERATION_VERSION,
  type OfficialDeadline,
  type RoadmapDocumentRequirement,
  type RoadmapRequirement,
  type RoadmapTargetInput,
  type TaskPriority,
  type TaskStatus,
} from './engine';
import { roadmapTemplates } from './copy';
import { isLocale, type Locale } from '@/lib/i18n/messages';
import {
  loadCandidatesWithin,
  loadMatchingState,
  MatchingUnavailable,
} from '@/features/matching/service';
import {
  recommend,
  type Candidate,
  type Recommendation,
} from '@/features/matching/engine';

type Client = SupabaseClient<Database>;
type LooseClient = SupabaseClient;
type QueryError = { message: string; code?: string } | null;

export class RoadmapUnavailable extends Error {}
export class RoadmapValidationError extends Error {}
export class RoadmapConflict extends Error {}
export class RoadmapBlocked extends Error {}
export class RoadmapNotFound extends Error {}

export type AvailableRoadmapTarget = {
  catalogEntityId: number;
  targetType: 'program' | 'scholarship';
  title: string;
  detailPath: string;
};

export type RoadmapState = {
  roadmap: null | {
    id: string;
    cycleYear: number;
    timezone: string;
    availabilityMinutesPerWeek: number;
    generationVersion: string;
    lastGeneratedAt: string | null;
    version: number;
  };
  targets: Array<AvailableRoadmapTarget & { id: string; active: boolean }>;
  milestones: Array<{
    id: string;
    generationKey: string;
    targetId: string | null;
    title: string;
    description: string;
    sequence: number;
    recommendedDate: string | null;
    active: boolean;
  }>;
  tasks: Array<{
    id: string;
    milestoneId: string | null;
    targetId: string | null;
    generationKey: string | null;
    origin: 'generated' | 'manual';
    taskKind: string;
    title: string;
    description: string;
    whyItMatters: string;
    status: TaskStatus;
    priority: TaskPriority;
    generatedPriority: TaskPriority;
    priorityOverride: TaskPriority | null;
    mandatory: boolean;
    officialDeadlineAt: string | null;
    officialDeadlineDate: string | null;
    deadlinePrecision: 'instant' | 'date_only' | 'rolling' | 'unknown';
    deadlineTimezone: string | null;
    sourceUrl: string | null;
    sourceCheckedAt: string | null;
    recommendedDueDate: string | null;
    targetDate: string | null;
    estimatedMinutes: number;
    note: string | null;
    completedAt: string | null;
    obsoleteAt: string | null;
    version: number;
  }>;
  dependencies: Array<{
    id: string;
    taskId: string;
    dependsOnTaskId: string;
    dependencyType: 'mandatory' | 'optional';
  }>;
  availableTargets: AvailableRoadmapTarget[];
};

function loose(client: Client) {
  return client as unknown as LooseClient;
}

function throwOn(error: QueryError) {
  if (error) throw new RoadmapUnavailable(error.message);
}

function sourceIsCurrent(
  source: {
    last_checked_at: string;
    is_active: boolean;
    effective_from: string | null;
    effective_until: string | null;
  },
  now: string,
) {
  const checked = new Date(source.last_checked_at).getTime();
  const current = new Date(now).getTime();
  return (
    source.is_active &&
    Number.isFinite(checked) &&
    checked <= current &&
    current - checked <= 180 * 86400000 &&
    (!source.effective_from || source.effective_from <= now.slice(0, 10)) &&
    (!source.effective_until || source.effective_until >= now.slice(0, 10))
  );
}

async function loadEvidence(
  client: Client,
  recommendations: Recommendation[],
  cycleYear: number,
) {
  const db = loose(client);
  const programIds = recommendations
    .filter((item) => item.candidate.entityType === 'program')
    .map((item) => item.candidate.id);
  const scholarshipIds = recommendations
    .filter((item) => item.candidate.entityType === 'scholarship')
    .map((item) => item.candidate.id);
  const [intakesResult, cyclesResult, applicationDetailsResult] =
    await Promise.all([
      programIds.length
        ? db
            .from('admission_intakes')
            .select('id,program_id,academic_year_start')
            .in('program_id', programIds)
            .eq('academic_year_start', cycleYear)
            .limit(100)
        : Promise.resolve({ data: [], error: null }),
      scholarshipIds.length
        ? db
            .from('scholarship_cycles')
            .select('id,scholarship_id,academic_year_start')
            .in('scholarship_id', scholarshipIds)
            .eq('academic_year_start', cycleYear)
            .limit(100)
        : Promise.resolve({ data: [], error: null }),
      scholarshipIds.length
        ? db
            .from('scholarship_application_details')
            .select('scholarship_id,admissions_linkage,source_claim_id')
            .in('scholarship_id', scholarshipIds)
            .limit(50)
        : Promise.resolve({ data: [], error: null }),
    ]);
  throwOn(intakesResult.error);
  throwOn(cyclesResult.error);
  throwOn(applicationDetailsResult.error);
  const intakes = (intakesResult.data ?? []) as Array<{
    id: number;
    program_id: number;
  }>;
  const cycles = (cyclesResult.data ?? []) as Array<{
    id: number;
    scholarship_id: number;
  }>;
  const intakeIds = intakes.map((item) => item.id);
  const cycleIds = cycles.map((item) => item.id);
  const [roundsResult, scholarshipDeadlineLinksResult, documentsResult] =
    await Promise.all([
      intakeIds.length
        ? db
            .from('application_rounds')
            .select('id,intake_id')
            .in('intake_id', intakeIds)
            .limit(200)
        : Promise.resolve({ data: [], error: null }),
      cycleIds.length
        ? db
            .from('scholarship_cycle_deadlines')
            .select('scholarship_cycle_id,deadline_id')
            .in('scholarship_cycle_id', cycleIds)
            .limit(200)
        : Promise.resolve({ data: [], error: null }),
      cycleIds.length
        ? db
            .from('scholarship_document_requirements')
            .select(
              'id,scholarship_cycle_id,document_name,requirement_state,source_claim_id',
            )
            .in('scholarship_cycle_id', cycleIds)
            .limit(300)
        : Promise.resolve({ data: [], error: null }),
    ]);
  throwOn(roundsResult.error);
  throwOn(scholarshipDeadlineLinksResult.error);
  throwOn(documentsResult.error);
  const rounds = (roundsResult.data ?? []) as Array<{
    id: number;
    intake_id: number;
  }>;
  const roundIds = rounds.map((item) => item.id);
  const programDeadlineLinksResult = roundIds.length
    ? await db
        .from('application_round_deadlines')
        .select('application_round_id,deadline_id')
        .in('application_round_id', roundIds)
        .limit(300)
    : { data: [], error: null };
  throwOn(programDeadlineLinksResult.error);
  const programDeadlineLinks = (programDeadlineLinksResult.data ??
    []) as Array<{ application_round_id: number; deadline_id: number }>;
  const scholarshipDeadlineLinks = (scholarshipDeadlineLinksResult.data ??
    []) as Array<{ scholarship_cycle_id: number; deadline_id: number }>;
  const deadlineIds = [
    ...new Set(
      [...programDeadlineLinks, ...scholarshipDeadlineLinks].map(
        (item) => item.deadline_id,
      ),
    ),
  ];
  const applicationDetails = (applicationDetailsResult.data ?? []) as Array<{
    scholarship_id: number;
    admissions_linkage: string;
    source_claim_id: number | null;
  }>;
  const documents = (documentsResult.data ?? []) as Array<{
    id: number;
    scholarship_cycle_id: number;
    document_name: string;
    requirement_state: RoadmapDocumentRequirement['state'];
    source_claim_id: number | null;
  }>;
  const claimIds = [
    ...new Set(
      [
        ...applicationDetails.map((item) => item.source_claim_id),
        ...documents.map((item) => item.source_claim_id),
      ].filter((value): value is number => value !== null),
    ),
  ];
  const entityIds = [...deadlineIds];
  const [deadlinesResult, claimsResult] = await Promise.all([
    deadlineIds.length
      ? db
          .from('deadlines')
          .select(
            'id,deadline_type,due_at,due_date,date_precision,timezone_name,is_rolling',
          )
          .in('id', deadlineIds)
          .limit(300)
      : Promise.resolve({ data: [], error: null }),
    deadlineIds.length || claimIds.length
      ? db
          .from('source_claims')
          .select(
            'id,catalog_entity_id,source_id,verification_state_code,effective_from,effective_until',
          )
          .or(
            `catalog_entity_id.in.(${entityIds.join(',')}),id.in.(${claimIds.join(',') || '0'})`,
          )
          .limit(600)
      : Promise.resolve({ data: [], error: null }),
  ]);
  throwOn(deadlinesResult.error);
  throwOn(claimsResult.error);
  const deadlines = (deadlinesResult.data ?? []) as Array<{
    id: number;
    deadline_type: string;
    due_at: string | null;
    due_date: string | null;
    date_precision: OfficialDeadline['precision'];
    timezone_name: string | null;
  }>;
  const claims = (claimsResult.data ?? []) as Array<{
    id: number;
    catalog_entity_id: number;
    source_id: number;
    verification_state_code: string;
    effective_from: string | null;
    effective_until: string | null;
  }>;
  const sourceIds = [...new Set(claims.map((claim) => claim.source_id))];
  const sourcesResult = sourceIds.length
    ? await db
        .from('official_sources')
        .select(
          'id,canonical_url,last_checked_at,is_active,effective_from,effective_until',
        )
        .in('id', sourceIds)
        .limit(600)
    : { data: [], error: null };
  throwOn(sourcesResult.error);
  const sources = new Map(
    (
      (sourcesResult.data ?? []) as Array<{
        id: number;
        canonical_url: string;
        last_checked_at: string;
        is_active: boolean;
        effective_from: string | null;
        effective_until: string | null;
      }>
    ).map((source) => [source.id, source]),
  );
  const now = new Date().toISOString();
  const verifiedClaim = (claim: (typeof claims)[number] | undefined) => {
    const source = claim ? sources.get(claim.source_id) : undefined;
    return Boolean(
      claim &&
      source &&
      claim.verification_state_code === 'verified' &&
      (!claim.effective_from || claim.effective_from <= now.slice(0, 10)) &&
      (!claim.effective_until || claim.effective_until >= now.slice(0, 10)) &&
      sourceIsCurrent(source, now),
    );
  };
  const evidenceForEntity = (entityId: number) => {
    const candidates = claims.filter(
      (claim) => claim.catalog_entity_id === entityId,
    );
    const claim = candidates.find(verifiedClaim);
    const source = claim ? sources.get(claim.source_id) : undefined;
    return {
      verified: Boolean(claim && source),
      sourceUrl: source?.canonical_url ?? null,
      sourceCheckedAt: source?.last_checked_at ?? null,
    };
  };
  const deadlineFor = (candidate: Candidate): OfficialDeadline => {
    const ids =
      candidate.entityType === 'program'
        ? programDeadlineLinks
            .filter((link) =>
              rounds.some(
                (round) =>
                  round.id === link.application_round_id &&
                  intakes.some(
                    (intake) =>
                      intake.id === round.intake_id &&
                      intake.program_id === candidate.id,
                  ),
              ),
            )
            .map((link) => link.deadline_id)
        : scholarshipDeadlineLinks
            .filter((link) =>
              cycles.some(
                (cycle) =>
                  cycle.id === link.scholarship_cycle_id &&
                  cycle.scholarship_id === candidate.id,
              ),
            )
            .map((link) => link.deadline_id);
    const deadline = deadlines.find(
      (item) =>
        ids.includes(item.id) &&
        (item.deadline_type === 'application' ||
          item.deadline_type === 'scholarship'),
    );
    if (!deadline)
      return normalizeOfficialDeadline({
        id: null,
        precision: 'unknown',
        at: null,
        date: null,
        timezone: null,
        sourceUrl: candidate.sourceUrl,
        sourceCheckedAt: candidate.sourceCheckedAt,
        verified: false,
      });
    const evidence = evidenceForEntity(deadline.id);
    return normalizeOfficialDeadline({
      id: deadline.id,
      precision: deadline.date_precision,
      at: deadline.due_at,
      date: deadline.due_date,
      timezone: deadline.timezone_name,
      sourceUrl: evidence.sourceUrl,
      sourceCheckedAt: evidence.sourceCheckedAt,
      verified: evidence.verified,
    });
  };
  const docsFor = (candidate: Candidate): RoadmapDocumentRequirement[] => {
    if (candidate.entityType !== 'scholarship') return [];
    const cycle = cycles.find((item) => item.scholarship_id === candidate.id);
    return documents
      .filter((item) => item.scholarship_cycle_id === cycle?.id)
      .map((item) => {
        const claim = claims.find(
          (candidateClaim) => candidateClaim.id === item.source_claim_id,
        );
        const source = claim ? sources.get(claim.source_id) : undefined;
        return {
          id: item.id,
          name: item.document_name,
          state: item.requirement_state,
          verified: verifiedClaim(claim),
          sourceUrl: source?.canonical_url ?? null,
        };
      });
  };
  const applicationFor = (
    candidate: Candidate,
  ): RoadmapTargetInput['scholarshipApplication'] => {
    if (candidate.entityType !== 'scholarship') return null;
    const details = applicationDetails.find(
      (item) => item.scholarship_id === candidate.id,
    );
    const claim = claims.find(
      (candidateClaim) => candidateClaim.id === details?.source_claim_id,
    );
    return details &&
      ['separate', 'with_admission', 'after_admission'].includes(
        details.admissions_linkage,
      ) &&
      verifiedClaim(claim)
      ? {
          linkage: details.admissions_linkage as
            'separate' | 'with_admission' | 'after_admission',
          verified: true,
        }
      : null;
  };
  return { deadlineFor, docsFor, applicationFor };
}

function requirementStatus(
  recommendation: Recommendation,
  requirementId: number,
): RoadmapRequirement['status'] {
  const statuses = recommendation.rules
    .filter((rule) => rule.id.startsWith(`requirement:${requirementId}:`))
    .map((rule) => rule.status);
  if (statuses.includes('NOT_MET')) return 'NOT_MET';
  if (statuses.includes('UNKNOWN') || statuses.length === 0) return 'UNKNOWN';
  if (statuses.includes('MET')) return 'MET';
  return 'NOT_APPLICABLE';
}

async function selectedRecommendations(
  client: Client,
  userId: string,
  ids: number[],
  cycleYear: number,
) {
  const db = loose(client);
  if (ids.length > 20 || new Set(ids).size !== ids.length)
    throw new RoadmapValidationError();
  if (!ids.length)
    return {
      state: await loadMatchingState(client, userId),
      recommendations: [] as Recommendation[],
    };
  const saves = await db
    .from('saved_catalog_items')
    .select('catalog_entity_id')
    .eq('user_id', userId)
    .in('catalog_entity_id', ids)
    .limit(20);
  throwOn(saves.error);
  const saved = new Set(
    ((saves.data ?? []) as Array<{ catalog_entity_id: number }>).map(
      (item) => item.catalog_entity_id,
    ),
  );
  if (ids.some((id) => !saved.has(id))) throw new RoadmapValidationError();
  const state = await loadMatchingState(client, userId);
  const candidates = await loadCandidatesWithin(client, cycleYear);
  const selected = candidates.filter((candidate) => ids.includes(candidate.id));
  if (selected.length !== ids.length)
    throw new RoadmapValidationError(
      'A selected target is no longer published or verified.',
    );
  return {
    state,
    recommendations: recommend(
      selected,
      state.profile,
      { ...state.preferences, enrollmentYear: cycleYear },
      new Date().toISOString(),
    ),
  };
}

export async function generateAndPersistRoadmap(
  client: Client,
  userId: string,
  input: {
    locale: Locale;
    cycleYear: number;
    timezone: string;
    availabilityMinutesPerWeek: number;
    targetIds: number[];
  },
) {
  const { state, recommendations } = await selectedRecommendations(
    client,
    userId,
    input.targetIds,
    input.cycleYear,
  );
  const evidence = await loadEvidence(client, recommendations, input.cycleYear);
  const targets: RoadmapTargetInput[] = recommendations.map(
    (recommendation) => ({
      catalogEntityId: recommendation.candidate.id,
      targetType: recommendation.candidate.entityType,
      title: recommendation.candidate.title,
      detailPath: recommendation.candidate.detailPath,
      deadline: evidence.deadlineFor(recommendation.candidate),
      requirements: recommendation.candidate.requirements.map(
        (requirement) => ({
          id: requirement.id,
          title: requirement.title,
          type: requirement.type,
          mandatory: requirement.mandatory,
          status: requirementStatus(recommendation, requirement.id),
          verification: requirement.verification,
          sourceUrl: requirement.sourceUrl,
          testCodes: (requirement.tests ?? []).map((test) => test.code),
        }),
      ),
      documents: evidence.docsFor(recommendation.candidate),
      scholarshipApplication: evidence.applicationFor(recommendation.candidate),
    }),
  );
  const generated = generateRoadmap({
    profileMissing:
      state.profileVersion === null
        ? ['profile']
        : [
            'studyLevel',
            'field',
            'nationality',
            'educationLevel',
            'graduationYear',
          ].filter((key) => !state.profile[key as keyof typeof state.profile]),
    targets,
    nowDate: new Date().toISOString().slice(0, 10),
    templates: roadmapTemplates[input.locale],
  });
  const stableInput = {
    cycleYear: input.cycleYear,
    timezone: input.timezone,
    availability: input.availabilityMinutesPerWeek,
    profileVersion: state.profileVersion,
    locale: input.locale,
    targets,
    generated,
  };
  const inputHash = createHash('sha256')
    .update(JSON.stringify(stableInput))
    .digest('hex');
  const result = await loose(client).rpc('roadmap_apply_generation', {
    p_cycle_year: input.cycleYear,
    p_timezone_name: input.timezone,
    p_availability_minutes_per_week: input.availabilityMinutesPerWeek,
    p_generation_version: ROADMAP_GENERATION_VERSION,
    p_input_hash: inputHash,
    p_profile_version: state.profileVersion,
    p_targets: targets.map((target) => ({
      catalogEntityId: target.catalogEntityId,
      targetType: target.targetType,
      title: target.title,
      detailPath: target.detailPath,
    })),
    p_milestones: generated.milestones,
    p_tasks: generated.tasks,
    p_dependencies: generated.dependencies,
  });
  throwOn(result.error);
  return result.data;
}

export async function loadAvailableTargets(
  client: Client,
  userId: string,
  cycleYear?: number,
) {
  try {
    const db = loose(client);
    const saves = await db
      .from('saved_catalog_items')
      .select('catalog_entity_id')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(50);
    throwOn(saves.error);
    const ids = new Set(
      ((saves.data ?? []) as Array<{ catalog_entity_id: number }>).map(
        (item) => item.catalog_entity_id,
      ),
    );
    if (!ids.size) return [];
    const candidates = await loadCandidatesWithin(client, cycleYear);
    return candidates
      .filter((candidate) => ids.has(candidate.id))
      .map((candidate) => ({
        catalogEntityId: candidate.id,
        targetType: candidate.entityType,
        title: candidate.title,
        detailPath: candidate.detailPath,
      }));
  } catch (error) {
    if (
      error instanceof MatchingUnavailable ||
      error instanceof RoadmapUnavailable
    )
      return [];
    throw error;
  }
}

export async function loadRoadmapState(
  client: Client,
  userId: string,
): Promise<RoadmapState> {
  const db = loose(client);
  const roadmapResult = await db
    .from('roadmaps')
    .select(
      'id,cycle_year,timezone_name,availability_minutes_per_week,generation_version,last_generated_at,version',
    )
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  throwOn(roadmapResult.error);
  const row = roadmapResult.data as null | {
    id: string;
    cycle_year: number;
    timezone_name: string;
    availability_minutes_per_week: number;
    generation_version: string;
    last_generated_at: string | null;
    version: number;
  };
  const availableTargets = await loadAvailableTargets(
    client,
    userId,
    row?.cycle_year,
  );
  if (!row)
    return {
      roadmap: null,
      targets: [],
      milestones: [],
      tasks: [],
      dependencies: [],
      availableTargets,
    };
  const [targetsResult, milestonesResult, tasksResult, dependenciesResult] =
    await Promise.all([
      db
        .from('roadmap_targets')
        .select(
          'id,catalog_entity_id,target_type,title_snapshot,detail_path,is_active',
        )
        .eq('roadmap_id', row.id)
        .order('created_at'),
      db
        .from('roadmap_milestones')
        .select(
          'id,generation_key,target_id,title,description,sequence,recommended_date,is_active',
        )
        .eq('roadmap_id', row.id)
        .order('sequence'),
      db
        .from('roadmap_tasks')
        .select(
          'id,milestone_id,target_id,generation_key,origin,task_kind,title,description,why_it_matters,status,generated_priority,priority_override,is_mandatory,official_deadline_at,official_deadline_date,official_deadline_precision,official_deadline_timezone,official_source_url,official_source_checked_at,recommended_due_date,target_date,estimated_minutes,note,completed_at,obsolete_at,version',
        )
        .eq('roadmap_id', row.id)
        .or('obsolete_at.is.null,status.eq.completed')
        .order('recommended_due_date', { nullsFirst: false })
        .limit(500),
      db
        .from('roadmap_task_dependencies')
        .select('id,task_id,depends_on_task_id,dependency_type')
        .eq('roadmap_id', row.id)
        .limit(1500),
    ]);
  throwOn(targetsResult.error);
  throwOn(milestonesResult.error);
  throwOn(tasksResult.error);
  throwOn(dependenciesResult.error);
  const targets = (targetsResult.data ?? []) as Array<Record<string, unknown>>;
  const milestones = (milestonesResult.data ?? []) as Array<
    Record<string, unknown>
  >;
  const tasks = (tasksResult.data ?? []) as Array<Record<string, unknown>>;
  const dependencies = (dependenciesResult.data ?? []) as Array<
    Record<string, unknown>
  >;
  return {
    roadmap: {
      id: row.id,
      cycleYear: row.cycle_year,
      timezone: row.timezone_name,
      availabilityMinutesPerWeek: row.availability_minutes_per_week,
      generationVersion: row.generation_version,
      lastGeneratedAt: row.last_generated_at,
      version: row.version,
    },
    targets: targets.map((item) => ({
      id: String(item.id),
      catalogEntityId: Number(item.catalog_entity_id),
      targetType: item.target_type as 'program' | 'scholarship',
      title: String(item.title_snapshot),
      detailPath: String(item.detail_path),
      active: Boolean(item.is_active),
    })),
    milestones: milestones.map((item) => ({
      id: String(item.id),
      generationKey: String(item.generation_key),
      targetId: item.target_id ? String(item.target_id) : null,
      title: String(item.title),
      description: String(item.description),
      sequence: Number(item.sequence),
      recommendedDate: item.recommended_date
        ? String(item.recommended_date)
        : null,
      active: Boolean(item.is_active),
    })),
    tasks: tasks.map((item) => ({
      id: String(item.id),
      milestoneId: item.milestone_id ? String(item.milestone_id) : null,
      targetId: item.target_id ? String(item.target_id) : null,
      generationKey: item.generation_key ? String(item.generation_key) : null,
      origin: item.origin as 'generated' | 'manual',
      taskKind: String(item.task_kind),
      title: String(item.title),
      description: String(item.description),
      whyItMatters: String(item.why_it_matters),
      status: item.status as TaskStatus,
      generatedPriority: item.generated_priority as TaskPriority,
      priorityOverride: item.priority_override as TaskPriority | null,
      priority: (item.priority_override ??
        item.generated_priority) as TaskPriority,
      mandatory: Boolean(item.is_mandatory),
      officialDeadlineAt: item.official_deadline_at
        ? String(item.official_deadline_at)
        : null,
      officialDeadlineDate: item.official_deadline_date
        ? String(item.official_deadline_date)
        : null,
      deadlinePrecision:
        item.official_deadline_precision as RoadmapState['tasks'][number]['deadlinePrecision'],
      deadlineTimezone: item.official_deadline_timezone
        ? String(item.official_deadline_timezone)
        : null,
      sourceUrl: item.official_source_url
        ? String(item.official_source_url)
        : null,
      sourceCheckedAt: item.official_source_checked_at
        ? String(item.official_source_checked_at)
        : null,
      recommendedDueDate: item.recommended_due_date
        ? String(item.recommended_due_date)
        : null,
      targetDate: item.target_date ? String(item.target_date) : null,
      estimatedMinutes: Number(item.estimated_minutes),
      note: item.note ? String(item.note) : null,
      completedAt: item.completed_at ? String(item.completed_at) : null,
      obsoleteAt: item.obsolete_at ? String(item.obsolete_at) : null,
      version: Number(item.version),
    })),
    dependencies: dependencies.map((item) => ({
      id: String(item.id),
      taskId: String(item.task_id),
      dependsOnTaskId: String(item.depends_on_task_id),
      dependencyType: item.dependency_type as 'mandatory' | 'optional',
    })),
    availableTargets,
  };
}

export async function createManualTask(
  client: Client,
  userId: string,
  input: {
    title: string;
    description: string;
    priority: TaskPriority;
    targetDate: string | null;
    note: string;
    estimatedMinutes: number;
  },
) {
  const db = loose(client);
  const roadmap = await db
    .from('roadmaps')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  throwOn(roadmap.error);
  if (!roadmap.data) throw new RoadmapNotFound();
  const result = await db
    .from('roadmap_tasks')
    .insert({
      roadmap_id: (roadmap.data as { id: string }).id,
      user_id: userId,
      generation_key: null,
      origin: 'manual',
      task_kind: 'other',
      title: input.title,
      description: input.description,
      why_it_matters: '',
      status: 'todo',
      generated_priority: input.priority,
      priority_override: input.priority,
      is_mandatory: false,
      official_deadline_precision: 'unknown',
      target_date: input.targetDate,
      estimated_minutes: input.estimatedMinutes,
      note: input.note || null,
    })
    .select('id')
    .single();
  throwOn(result.error);
  return result.data;
}

export async function updateRoadmapTask(
  client: Client,
  userId: string,
  taskId: string,
  input: {
    version: number;
    status?: TaskStatus;
    priority?: TaskPriority;
    targetDate?: string | null;
    note?: string;
    title?: string;
    description?: string;
  },
) {
  const db = loose(client);
  const current = await db
    .from('roadmap_tasks')
    .select('id,origin,version')
    .eq('id', taskId)
    .eq('user_id', userId)
    .maybeSingle();
  throwOn(current.error);
  if (!current.data) throw new RoadmapNotFound();
  const row = current.data as {
    origin: 'generated' | 'manual';
    version: number;
  };
  if (row.version !== input.version) throw new RoadmapConflict();
  if (
    row.origin !== 'manual' &&
    (input.title !== undefined || input.description !== undefined)
  )
    throw new RoadmapValidationError();
  const patch: Record<string, unknown> = { version: input.version + 1 };
  if (input.status !== undefined) patch.status = input.status;
  if (input.priority !== undefined) patch.priority_override = input.priority;
  if (input.targetDate !== undefined) patch.target_date = input.targetDate;
  if (input.note !== undefined) patch.note = input.note || null;
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  const result = await db
    .from('roadmap_tasks')
    .update(patch)
    .eq('id', taskId)
    .eq('user_id', userId)
    .eq('version', input.version)
    .select('id,status,version')
    .maybeSingle();
  if (result.error?.code === '23514')
    throw new RoadmapBlocked(result.error.message);
  if (result.error?.code === '40001') throw new RoadmapConflict();
  throwOn(result.error);
  if (!result.data) throw new RoadmapConflict();
  return result.data;
}

export async function deleteManualTask(
  client: Client,
  userId: string,
  taskId: string,
  version: number,
) {
  const db = loose(client);
  const result = await db
    .from('roadmap_tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId)
    .eq('origin', 'manual')
    .eq('version', version)
    .select('id')
    .maybeSingle();
  throwOn(result.error);
  if (!result.data) throw new RoadmapConflict();
}

export function validLocale(value: unknown): Locale {
  return typeof value === 'string' && isLocale(value) ? value : 'ru';
}
