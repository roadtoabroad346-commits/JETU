import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import type { UnifiedSearchRow } from '@/features/search/server';
import {
  applicationMetrics,
  checklistReadiness,
  type ApplicationStatus,
  type ScholarshipApplicationStatus,
} from './engine';

type Client = SupabaseClient<Database>;
type LooseClient = SupabaseClient;
type QueryError = { message: string; code?: string } | null;

export class ApplicationUnavailable extends Error {}
export class ApplicationNotFound extends Error {}
export class ApplicationConflict extends Error {}
export class ApplicationBlocked extends Error {}

export type AvailableApplicationTarget = {
  id: number;
  title: string;
  subtitle: string | null;
  countryCode: string | null;
  degreeLevel: string | null;
  detailPath: string;
};

export type ApplicationSummary = {
  id: string;
  programId: number;
  cycleYear: number;
  programTitle: string;
  institutionName: string;
  degreeLevel: string;
  countryCode: string | null;
  status: ApplicationStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadlineAt: string | null;
  deadlineDate: string | null;
  deadlinePrecision: 'instant' | 'date_only' | 'rolling' | 'unknown';
  deadlineTimezone: string | null;
  sourceUrl: string | null;
  sourceCheckedAt: string | null;
  portalUrl: string | null;
  updatedAt: string;
  version: number;
  readiness: ReturnType<typeof checklistReadiness>;
  scholarshipCount: number;
};

export type ApplicationChecklistItem = {
  id: string;
  key: string | null;
  title: string;
  status: 'todo' | 'completed' | 'not_applicable';
  mandatory: boolean;
  origin: 'system' | 'roadmap' | 'manual';
  verificationState: 'verified' | 'unknown' | 'user_created';
  roadmapTaskId: string | null;
  version: number;
};

export type ScholarshipApplication = {
  id: string;
  scholarshipId: number;
  title: string;
  cycleYear: number;
  status: ScholarshipApplicationStatus;
  sourceUrl: string | null;
  portalUrl: string | null;
  deadlineAt: string | null;
  deadlineDate: string | null;
  deadlinePrecision: 'instant' | 'date_only' | 'rolling' | 'unknown';
  submittedAt: string | null;
  submissionEvidence: string | null;
  version: number;
};

export type ApplicationEvent = {
  id: number;
  eventType: string;
  fromStatus: string | null;
  toStatus: string | null;
  sourceType: 'SYSTEM' | 'USER_REPORTED';
  reason: string | null;
  evidence: string | null;
  details: Record<string, unknown>;
  occurredAt: string;
};

export type ApplicationPortfolio = {
  applications: ApplicationSummary[];
  availablePrograms: AvailableApplicationTarget[];
  metrics: ReturnType<typeof applicationMetrics>;
};

export type ApplicationWorkspaceState = {
  application: ApplicationSummary & {
    notes: string;
    userReferenceId: string | null;
    submittedAt: string | null;
    submissionEvidence: string | null;
    submissionProvenance: 'USER_REPORTED' | null;
    feeAmount: number | null;
    feeCurrency: string | null;
    feeWaiverState: 'available' | 'not_available' | 'unknown';
    roadmapSubmissionTaskId: string | null;
  };
  checklist: ApplicationChecklistItem[];
  events: ApplicationEvent[];
  scholarships: ScholarshipApplication[];
  availableScholarships: AvailableApplicationTarget[];
};

function loose(client: Client) {
  return client as unknown as LooseClient;
}

function throwOn(error: QueryError) {
  if (!error) return;
  if (error.code === '40001' || error.code === '23505')
    throw new ApplicationConflict(error.message);
  if (error.code === '23514') throw new ApplicationBlocked(error.message);
  if (error.code === '42501') throw new ApplicationNotFound(error.message);
  throw new ApplicationUnavailable(error.message);
}

async function availableTargets(
  client: Client,
  type: 'program' | 'scholarship',
) {
  const result = await loose(client).rpc('unified_catalog_search', {
    p_filters: { type, sort: 'title', limit: 100, offset: 0 },
  });
  throwOn(result.error);
  return ((result.data ?? []) as UnifiedSearchRow[]).map((row) => ({
    id: row.entity_id,
    title: row.title,
    subtitle: row.subtitle,
    countryCode: row.country_code,
    degreeLevel: row.degree_level,
    detailPath: row.detail_path,
  }));
}

function mapChecklist(rows: Array<Record<string, unknown>>) {
  return rows.map((row): ApplicationChecklistItem => ({
    id: String(row.id),
    key: row.checklist_key ? String(row.checklist_key) : null,
    title: String(row.title),
    status: row.status as ApplicationChecklistItem['status'],
    mandatory: Boolean(row.is_mandatory),
    origin: row.origin as ApplicationChecklistItem['origin'],
    verificationState:
      row.verification_state as ApplicationChecklistItem['verificationState'],
    roadmapTaskId: row.roadmap_task_id ? String(row.roadmap_task_id) : null,
    version: Number(row.version),
  }));
}

function mapScholarships(rows: Array<Record<string, unknown>>) {
  return rows.map((row): ScholarshipApplication => ({
    id: String(row.id),
    scholarshipId: Number(row.scholarship_id),
    title: String(row.scholarship_title_snapshot),
    cycleYear: Number(row.cycle_year),
    status: row.status as ScholarshipApplicationStatus,
    sourceUrl: row.source_url ? String(row.source_url) : null,
    portalUrl: row.official_portal_url ? String(row.official_portal_url) : null,
    deadlineAt: row.deadline_at ? String(row.deadline_at) : null,
    deadlineDate: row.deadline_date ? String(row.deadline_date) : null,
    deadlinePrecision:
      row.deadline_precision as ScholarshipApplication['deadlinePrecision'],
    submittedAt: row.submitted_at ? String(row.submitted_at) : null,
    submissionEvidence: row.submission_evidence
      ? String(row.submission_evidence)
      : null,
    version: Number(row.version),
  }));
}

function summary(
  row: Record<string, unknown>,
  checklist: ApplicationChecklistItem[],
  scholarshipCount: number,
): ApplicationSummary {
  return {
    id: String(row.id),
    programId: Number(row.program_id),
    cycleYear: Number(row.cycle_year),
    programTitle: String(row.program_title_snapshot),
    institutionName: String(row.institution_name_snapshot),
    degreeLevel: String(row.degree_level_snapshot),
    countryCode: row.country_code_snapshot
      ? String(row.country_code_snapshot)
      : null,
    status: row.status as ApplicationStatus,
    priority: row.priority as ApplicationSummary['priority'],
    deadlineAt: row.official_deadline_at
      ? String(row.official_deadline_at)
      : null,
    deadlineDate: row.official_deadline_date
      ? String(row.official_deadline_date)
      : null,
    deadlinePrecision:
      row.official_deadline_precision as ApplicationSummary['deadlinePrecision'],
    deadlineTimezone: row.official_deadline_timezone
      ? String(row.official_deadline_timezone)
      : null,
    sourceUrl: row.program_source_url ? String(row.program_source_url) : null,
    sourceCheckedAt: row.program_source_checked_at
      ? String(row.program_source_checked_at)
      : null,
    portalUrl: row.official_portal_url ? String(row.official_portal_url) : null,
    updatedAt: String(row.updated_at),
    version: Number(row.version),
    readiness: checklistReadiness(
      checklist.map((item) => ({
        id: item.id,
        status: item.status,
        isMandatory: item.mandatory,
      })),
    ),
    scholarshipCount,
  };
}

export async function loadApplicationPortfolio(
  client: Client,
  userId: string,
): Promise<ApplicationPortfolio> {
  const db = loose(client);
  const [appsResult, checklistResult, scholarshipsResult, programs] =
    await Promise.all([
      db
        .from('applications')
        .select('*')
        .eq('user_id', userId)
        .is('archived_at', null)
        .order('updated_at', { ascending: false })
        .limit(100),
      db
        .from('application_checklist_items')
        .select('id,application_id,status,is_mandatory')
        .eq('user_id', userId)
        .limit(1000),
      db
        .from('scholarship_applications')
        .select('id,application_id')
        .eq('user_id', userId)
        .limit(500),
      availableTargets(client, 'program'),
    ]);
  throwOn(appsResult.error);
  throwOn(checklistResult.error);
  throwOn(scholarshipsResult.error);
  const checklistRows = (checklistResult.data ?? []) as Array<
    Record<string, unknown>
  >;
  const scholarshipRows = (scholarshipsResult.data ?? []) as Array<
    Record<string, unknown>
  >;
  const applications = (
    (appsResult.data ?? []) as Array<Record<string, unknown>>
  ).map((row) => {
    const items = checklistRows
      .filter((item) => item.application_id === row.id)
      .map((item) => ({
        id: String(item.id),
        key: null,
        title: '',
        status: item.status as ApplicationChecklistItem['status'],
        mandatory: Boolean(item.is_mandatory),
        origin: 'system' as const,
        verificationState: 'unknown' as const,
        roadmapTaskId: null,
        version: 1,
      }));
    return summary(
      row,
      items,
      scholarshipRows.filter((item) => item.application_id === row.id).length,
    );
  });
  return {
    applications,
    // The same program can legitimately be tracked in another cycle. The
    // database idempotently resolves an exact program/intake/cycle duplicate.
    availablePrograms: programs,
    metrics: applicationMetrics(
      applications.map((application) => application.status),
    ),
  };
}

export async function loadApplicationWorkspace(
  client: Client,
  userId: string,
  applicationId: string,
): Promise<ApplicationWorkspaceState> {
  const db = loose(client);
  const [appResult, checklistResult, eventsResult, scholarshipsResult] =
    await Promise.all([
      db
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .eq('user_id', userId)
        .maybeSingle(),
      db
        .from('application_checklist_items')
        .select('*')
        .eq('application_id', applicationId)
        .eq('user_id', userId)
        .order('sort_order'),
      db
        .from('application_events')
        .select('*')
        .eq('application_id', applicationId)
        .eq('user_id', userId)
        .order('occurred_at', { ascending: false })
        .limit(200),
      db
        .from('scholarship_applications')
        .select('*')
        .eq('application_id', applicationId)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(100),
    ]);
  throwOn(appResult.error);
  throwOn(checklistResult.error);
  throwOn(eventsResult.error);
  throwOn(scholarshipsResult.error);
  if (!appResult.data) throw new ApplicationNotFound();
  const row = appResult.data as Record<string, unknown>;
  const checklist = mapChecklist(
    (checklistResult.data ?? []) as Array<Record<string, unknown>>,
  );
  const scholarships = mapScholarships(
    (scholarshipsResult.data ?? []) as Array<Record<string, unknown>>,
  );
  const availableScholarships = (
    await availableTargets(client, 'scholarship')
  ).filter(
    (target) =>
      !scholarships.some(
        (scholarship) => scholarship.scholarshipId === target.id,
      ),
  );
  return {
    application: {
      ...summary(row, checklist, scholarships.length),
      notes: String(row.notes ?? ''),
      userReferenceId: row.user_reference_id
        ? String(row.user_reference_id)
        : null,
      submittedAt: row.submitted_at ? String(row.submitted_at) : null,
      submissionEvidence: row.submission_evidence
        ? String(row.submission_evidence)
        : null,
      submissionProvenance:
        (row.submission_provenance as 'USER_REPORTED' | null) ?? null,
      feeAmount:
        row.application_fee_amount === null
          ? null
          : Number(row.application_fee_amount),
      feeCurrency: row.application_fee_currency
        ? String(row.application_fee_currency)
        : null,
      feeWaiverState: row.fee_waiver_state as
        'available' | 'not_available' | 'unknown',
      roadmapSubmissionTaskId: row.roadmap_submission_task_id
        ? String(row.roadmap_submission_task_id)
        : null,
    },
    checklist,
    scholarships,
    availableScholarships,
    events: ((eventsResult.data ?? []) as Array<Record<string, unknown>>).map(
      (event) => ({
        id: Number(event.id),
        eventType: String(event.event_type),
        fromStatus: event.from_status ? String(event.from_status) : null,
        toStatus: event.to_status ? String(event.to_status) : null,
        sourceType: event.source_type as 'SYSTEM' | 'USER_REPORTED',
        reason: event.reason ? String(event.reason) : null,
        evidence: event.evidence ? String(event.evidence) : null,
        details: (event.details ?? {}) as Record<string, unknown>,
        occurredAt: String(event.occurred_at),
      }),
    ),
  };
}

export async function createApplication(
  client: Client,
  programId: number,
  intakeId: number | null,
  cycleYear: number,
  idempotencyKey: string,
) {
  const result = await loose(client).rpc('application_create', {
    p_program_id: programId,
    p_intake_id: intakeId,
    p_cycle_year: cycleYear,
    p_idempotency_key: idempotencyKey,
  });
  throwOn(result.error);
  return result.data;
}

export async function updateApplicationMetadata(
  client: Client,
  input: {
    applicationId: string;
    version: number;
    notes: string;
    userReferenceId: string;
    priority: ApplicationSummary['priority'];
  },
) {
  const result = await loose(client).rpc('application_update_metadata', {
    p_application_id: input.applicationId,
    p_expected_version: input.version,
    p_notes: input.notes,
    p_user_reference_id: input.userReferenceId,
    p_priority: input.priority,
  });
  throwOn(result.error);
  return result.data;
}

export async function transitionApplication(
  client: Client,
  input: {
    applicationId: string;
    version: number;
    toStatus: ApplicationStatus;
    reason: string;
    evidence: string;
    userConfirmed: boolean;
    idempotencyKey: string;
  },
) {
  const result = await loose(client).rpc('application_transition', {
    p_application_id: input.applicationId,
    p_expected_version: input.version,
    p_to_status: input.toStatus,
    p_reason: input.reason,
    p_evidence: input.evidence,
    p_user_confirmed: input.userConfirmed,
    p_idempotency_key: input.idempotencyKey,
  });
  throwOn(result.error);
  return result.data;
}

export async function changeChecklistItem(
  client: Client,
  input: {
    applicationId: string;
    itemId: string | null;
    version: number | null;
    title: string;
    status: ApplicationChecklistItem['status'];
    mandatory: boolean;
  },
) {
  const result = await loose(client).rpc('application_checklist_change', {
    p_application_id: input.applicationId,
    p_item_id: input.itemId,
    p_expected_version: input.version,
    p_title: input.title,
    p_status: input.status,
    p_is_mandatory: input.mandatory,
  });
  throwOn(result.error);
  return result.data;
}

export async function addScholarshipApplication(
  client: Client,
  input: {
    applicationId: string;
    scholarshipId: number;
    scholarshipCycleId: number | null;
    cycleYear: number;
    idempotencyKey: string;
  },
) {
  const result = await loose(client).rpc('application_add_scholarship', {
    p_application_id: input.applicationId,
    p_scholarship_id: input.scholarshipId,
    p_scholarship_cycle_id: input.scholarshipCycleId,
    p_cycle_year: input.cycleYear,
    p_idempotency_key: input.idempotencyKey,
  });
  throwOn(result.error);
  return result.data;
}

export async function transitionScholarshipApplication(
  client: Client,
  input: {
    scholarshipApplicationId: string;
    version: number;
    toStatus: ScholarshipApplicationStatus;
    reason: string;
    evidence: string;
    userConfirmed: boolean;
    idempotencyKey: string;
  },
) {
  const result = await loose(client).rpc('scholarship_application_transition', {
    p_scholarship_application_id: input.scholarshipApplicationId,
    p_expected_version: input.version,
    p_to_status: input.toStatus,
    p_reason: input.reason,
    p_evidence: input.evidence,
    p_user_confirmed: input.userConfirmed,
    p_idempotency_key: input.idempotencyKey,
  });
  throwOn(result.error);
  return result.data;
}
