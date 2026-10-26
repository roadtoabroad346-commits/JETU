export const APPLICATION_STATUSES = [
  'researching',
  'shortlisted',
  'preparing',
  'ready_for_review',
  'ready_to_submit',
  'submitted_external_confirmed',
  'under_review',
  'interview',
  'offer',
  'waitlist',
  'rejected',
  'accepted',
  'declined',
  'enrollment',
  'withdrawn',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const SCHOLARSHIP_APPLICATION_STATUSES = [
  'researching',
  'preparing',
  'ready_to_submit',
  'submitted_external_confirmed',
  'under_review',
  'awarded',
  'not_awarded',
  'withdrawn',
] as const;

export type ScholarshipApplicationStatus =
  (typeof SCHOLARSHIP_APPLICATION_STATUSES)[number];

export const applicationTransitions: Record<
  ApplicationStatus,
  readonly ApplicationStatus[]
> = {
  researching: ['shortlisted', 'withdrawn'],
  shortlisted: ['researching', 'preparing', 'withdrawn'],
  preparing: ['shortlisted', 'ready_for_review', 'withdrawn'],
  ready_for_review: ['preparing', 'ready_to_submit', 'withdrawn'],
  ready_to_submit: [
    'ready_for_review',
    'submitted_external_confirmed',
    'withdrawn',
  ],
  submitted_external_confirmed: ['under_review', 'withdrawn'],
  under_review: ['interview', 'offer', 'waitlist', 'rejected', 'withdrawn'],
  interview: ['under_review', 'offer', 'waitlist', 'rejected', 'withdrawn'],
  offer: ['accepted', 'declined', 'withdrawn'],
  waitlist: ['offer', 'rejected', 'withdrawn'],
  rejected: [],
  accepted: ['enrollment', 'declined', 'withdrawn'],
  declined: [],
  enrollment: [],
  withdrawn: ['researching'],
};

export const scholarshipTransitions: Record<
  ScholarshipApplicationStatus,
  readonly ScholarshipApplicationStatus[]
> = {
  researching: ['preparing', 'withdrawn'],
  preparing: ['researching', 'ready_to_submit', 'withdrawn'],
  ready_to_submit: ['preparing', 'submitted_external_confirmed', 'withdrawn'],
  submitted_external_confirmed: ['under_review', 'withdrawn'],
  under_review: ['awarded', 'not_awarded', 'withdrawn'],
  awarded: [],
  not_awarded: [],
  withdrawn: ['researching'],
};

export const statusAliases = {
  considering: 'researching',
  ready_to_apply: 'ready_to_submit',
  externally_submitted: 'submitted_external_confirmed',
  awaiting_result: 'under_review',
  decision_received: 'offer',
} as const satisfies Record<string, ApplicationStatus>;

export type ChecklistItem = {
  id: string;
  status: 'todo' | 'completed' | 'not_applicable';
  isMandatory: boolean;
};

export type TransitionContext = {
  checklist: ChecklistItem[];
  explicitUserConfirmation?: boolean;
  evidence?: string;
  reason?: string;
};

export type TransitionVerdict =
  | { allowed: true }
  | {
      allowed: false;
      reason:
        | 'same_status'
        | 'transition_not_allowed'
        | 'mandatory_checklist_incomplete'
        | 'submission_confirmation_required'
        | 'outcome_reason_required'
        | 'reopen_reason_required';
    };

const readinessStatuses = new Set<ApplicationStatus>([
  'ready_for_review',
  'ready_to_submit',
  'submitted_external_confirmed',
]);

const reasonStatuses = new Set<ApplicationStatus>([
  'interview',
  'offer',
  'waitlist',
  'rejected',
  'accepted',
  'declined',
  'enrollment',
  'withdrawn',
]);

export function checklistReadiness(items: ChecklistItem[]) {
  const required = items.filter((item) => item.isMandatory);
  const completed = required.filter((item) => item.status === 'completed');
  return {
    completed: completed.length,
    total: required.length,
    percent: required.length
      ? Math.round((completed.length / required.length) * 100)
      : 0,
    blockers: required
      .filter((item) => item.status !== 'completed')
      .map((item) => item.id),
  };
}

export function validateApplicationTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
  context: TransitionContext,
): TransitionVerdict {
  if (from === to) return { allowed: false, reason: 'same_status' };
  if (!applicationTransitions[from].includes(to))
    return { allowed: false, reason: 'transition_not_allowed' };
  if (
    readinessStatuses.has(to) &&
    checklistReadiness(context.checklist).blockers.length
  )
    return { allowed: false, reason: 'mandatory_checklist_incomplete' };
  if (
    to === 'submitted_external_confirmed' &&
    (!context.explicitUserConfirmation ||
      (context.evidence?.trim().length ?? 0) < 3)
  )
    return { allowed: false, reason: 'submission_confirmation_required' };
  if (reasonStatuses.has(to) && (context.reason?.trim().length ?? 0) < 3)
    return { allowed: false, reason: 'outcome_reason_required' };
  if (
    from === 'withdrawn' &&
    to === 'researching' &&
    (context.reason?.trim().length ?? 0) < 10
  )
    return { allowed: false, reason: 'reopen_reason_required' };
  return { allowed: true };
}

export function validateScholarshipTransition(
  from: ScholarshipApplicationStatus,
  to: ScholarshipApplicationStatus,
  context: Omit<TransitionContext, 'checklist'>,
): TransitionVerdict {
  if (from === to) return { allowed: false, reason: 'same_status' };
  if (!scholarshipTransitions[from].includes(to))
    return { allowed: false, reason: 'transition_not_allowed' };
  if (
    to === 'submitted_external_confirmed' &&
    (!context.explicitUserConfirmation ||
      (context.evidence?.trim().length ?? 0) < 3)
  )
    return { allowed: false, reason: 'submission_confirmation_required' };
  if (
    ['awarded', 'not_awarded', 'withdrawn'].includes(to) &&
    (context.reason?.trim().length ?? 0) < 3
  )
    return { allowed: false, reason: 'outcome_reason_required' };
  if (
    from === 'withdrawn' &&
    to === 'researching' &&
    (context.reason?.trim().length ?? 0) < 10
  )
    return { allowed: false, reason: 'reopen_reason_required' };
  return { allowed: true };
}

export function applicationMetrics(statuses: ApplicationStatus[]) {
  const count = (group: readonly ApplicationStatus[]) =>
    statuses.filter((status) => group.includes(status)).length;
  return {
    researching: count(['researching', 'shortlisted']),
    preparing: count(['preparing', 'ready_for_review', 'ready_to_submit']),
    submitted: count(['submitted_external_confirmed']),
    awaitingResult: count(['under_review', 'interview', 'waitlist']),
    offers: count(['offer', 'accepted', 'enrollment']),
  };
}

export function daysUntilDeadline(
  deadline: { at: string | null; date: string | null; precision: string },
  nowDate: string,
) {
  const value =
    deadline.precision === 'instant'
      ? deadline.at?.slice(0, 10)
      : deadline.precision === 'date_only'
        ? deadline.date
        : null;
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const due = Date.parse(`${value}T00:00:00Z`);
  const now = Date.parse(`${nowDate}T00:00:00Z`);
  if (!Number.isFinite(due) || !Number.isFinite(now)) return null;
  return Math.round((due - now) / 86_400_000);
}
