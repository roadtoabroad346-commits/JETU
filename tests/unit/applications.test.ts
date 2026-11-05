import { describe, expect, it } from 'vitest';
import {
  APPLICATION_STATUSES,
  applicationMetrics,
  applicationTransitions,
  checklistReadiness,
  daysUntilDeadline,
  SCHOLARSHIP_APPLICATION_STATUSES,
  scholarshipTransitions,
  statusAliases,
  validateApplicationTransition,
  validateScholarshipTransition,
  type ApplicationStatus,
} from '@/features/applications/engine';

const complete = [
  { id: 'documents', status: 'completed' as const, isMandatory: true },
];

describe('application state machine', () => {
  it('defines every canonical state exactly once', () => {
    expect(new Set(APPLICATION_STATUSES).size).toBe(
      APPLICATION_STATUSES.length,
    );
    expect(Object.keys(applicationTransitions).sort()).toEqual(
      [...APPLICATION_STATUSES].sort(),
    );
  });

  it('keeps legacy vocabulary as aliases, not duplicate states', () => {
    expect(statusAliases.externally_submitted).toBe(
      'submitted_external_confirmed',
    );
    expect(APPLICATION_STATUSES).not.toContain(
      'externally_submitted' as ApplicationStatus,
    );
  });

  it('accepts every declared transition when its guard evidence is present', () => {
    for (const [from, targets] of Object.entries(applicationTransitions)) {
      for (const to of targets) {
        expect(
          validateApplicationTransition(from as ApplicationStatus, to, {
            checklist: complete,
            explicitUserConfirmation: true,
            evidence: 'Portal receipt supplied by the student',
            reason: 'Student reported this outcome',
          }),
          `${from} -> ${to}`,
        ).toEqual({ allowed: true });
      }
    }
  });

  it('rejects every transition absent from the canonical map', () => {
    for (const from of APPLICATION_STATUSES) {
      for (const to of APPLICATION_STATUSES) {
        if (from === to || applicationTransitions[from].includes(to)) continue;
        expect(
          validateApplicationTransition(from, to, {
            checklist: complete,
            explicitUserConfirmation: true,
            evidence: 'Receipt',
            reason: 'Reported reason',
          }).allowed,
          `${from} -> ${to}`,
        ).toBe(false);
      }
    }
  });

  it('blocks readiness while a mandatory item is incomplete', () => {
    expect(
      validateApplicationTransition('preparing', 'ready_for_review', {
        checklist: [
          { id: 'essay', status: 'todo', isMandatory: true },
          { id: 'optional', status: 'todo', isMandatory: false },
        ],
      }),
    ).toEqual({
      allowed: false,
      reason: 'mandatory_checklist_incomplete',
    });
  });

  it('requires explicit student confirmation and evidence for submission', () => {
    expect(
      validateApplicationTransition(
        'ready_to_submit',
        'submitted_external_confirmed',
        { checklist: complete, explicitUserConfirmation: false, evidence: '' },
      ),
    ).toEqual({
      allowed: false,
      reason: 'submission_confirmation_required',
    });
  });

  it('cannot accept without an offer or enroll without acceptance', () => {
    expect(
      validateApplicationTransition('under_review', 'accepted', {
        checklist: complete,
        reason: 'Student reported acceptance',
      }).allowed,
    ).toBe(false);
    expect(
      validateApplicationTransition('offer', 'enrollment', {
        checklist: complete,
        reason: 'Student reported enrollment',
      }).allowed,
    ).toBe(false);
  });

  it('requires a meaningful explanation to reopen withdrawal', () => {
    expect(
      validateApplicationTransition('withdrawn', 'researching', {
        checklist: complete,
        reason: 'retry',
      }),
    ).toEqual({ allowed: false, reason: 'reopen_reason_required' });
  });
});

describe('scholarship state machine', () => {
  it('covers every independent scholarship state', () => {
    expect(Object.keys(scholarshipTransitions).sort()).toEqual(
      [...SCHOLARSHIP_APPLICATION_STATUSES].sort(),
    );
  });

  it('requires evidence for a separate external scholarship submission', () => {
    expect(
      validateScholarshipTransition(
        'ready_to_submit',
        'submitted_external_confirmed',
        { explicitUserConfirmation: true, evidence: '' },
      ),
    ).toEqual({
      allowed: false,
      reason: 'submission_confirmation_required',
    });
  });
});

describe('application readiness and portfolio summaries', () => {
  it('excludes optional items from the readiness denominator', () => {
    expect(
      checklistReadiness([
        { id: 'a', status: 'completed', isMandatory: true },
        { id: 'b', status: 'todo', isMandatory: false },
      ]),
    ).toEqual({ completed: 1, total: 1, percent: 100, blockers: [] });
  });

  it('does not present an empty checklist as complete', () => {
    expect(checklistReadiness([]).percent).toBe(0);
  });

  it('separates preparation, submission and outcomes', () => {
    expect(
      applicationMetrics([
        'researching',
        'ready_to_submit',
        'submitted_external_confirmed',
        'waitlist',
        'accepted',
      ]),
    ).toEqual({
      researching: 1,
      preparing: 1,
      submitted: 1,
      awaitingResult: 1,
      offers: 1,
    });
  });

  it('preserves unknown and malformed deadline states', () => {
    expect(
      daysUntilDeadline(
        { at: null, date: null, precision: 'unknown' },
        '2026-10-26',
      ),
    ).toBeNull();
    expect(
      daysUntilDeadline(
        { at: null, date: '2026-11-05', precision: 'date_only' },
        '2026-10-26',
      ),
    ).toBe(10);
  });
});
