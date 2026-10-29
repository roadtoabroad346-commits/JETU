import { describe, expect, it } from 'vitest';
import {
  calculateProgress,
  generateRoadmap,
  mergeRoadmapTasks,
  nextBestAction,
  normalizeOfficialDeadline,
  officialDeadlineDate,
  priorityForTask,
  subtractCalendarDays,
  topologicalOrder,
  unmetMandatoryDependencies,
  validateDependencyGraph,
  type PersistedTask,
  type RoadmapTargetInput,
} from '@/features/roadmap/engine';

const instantDeadline = {
  id: 10,
  precision: 'instant' as const,
  at: '2027-01-16T04:59:00Z',
  date: null,
  timezone: 'America/Toronto',
  sourceUrl: 'https://example.edu/deadline',
  sourceCheckedAt: '2026-10-01T00:00:00Z',
  verified: true,
};

const target: RoadmapTargetInput = {
  catalogEntityId: 100,
  targetType: 'program',
  title: 'Verified program',
  detailPath: '/programs/100',
  deadline: instantDeadline,
  requirements: [],
  documents: [],
  scholarshipApplication: null,
};

describe('roadmap deadline engine', () => {
  it('uses the official timezone to derive the calendar day', () => {
    expect(officialDeadlineDate(instantDeadline)).toBe('2027-01-15');
  });

  it('keeps a date-only deadline free of invented time', () => {
    const result = normalizeOfficialDeadline({
      ...instantDeadline,
      precision: 'date_only',
      at: null,
      date: '2027-02-01',
      timezone: null,
    });
    expect(result).toMatchObject({
      precision: 'date_only',
      at: null,
      date: '2027-02-01',
    });
  });

  it('fails malformed instants closed to unknown', () => {
    expect(
      normalizeOfficialDeadline({ ...instantDeadline, at: 'wrong' }).precision,
    ).toBe('unknown');
  });

  it('calculates internal buffer dates without mutating official dates', () => {
    expect(subtractCalendarDays('2027-01-15', 28)).toBe('2026-12-18');
    expect(instantDeadline.at).toBe('2027-01-16T04:59:00Z');
  });

  it('raises overdue mandatory work without punitive scoring', () => {
    expect(
      priorityForTask({
        mandatory: true,
        dueDate: '2026-10-20',
        nowDate: '2026-10-26',
      }),
    ).toBe('critical');
    expect(
      priorityForTask({
        mandatory: false,
        dueDate: null,
        nowDate: '2026-10-26',
      }),
    ).toBe('low');
  });
});

describe('roadmap dependency graph', () => {
  const tasks = [{ id: 'research' }, { id: 'prepare' }, { id: 'submit' }];
  const edges = [
    {
      taskId: 'prepare',
      dependsOnTaskId: 'research',
      dependencyType: 'mandatory' as const,
    },
    {
      taskId: 'submit',
      dependsOnTaskId: 'prepare',
      dependencyType: 'mandatory' as const,
    },
  ];

  it('orders prerequisites before dependents', () => {
    expect(topologicalOrder(tasks, edges)).toEqual([
      'research',
      'prepare',
      'submit',
    ]);
  });

  it('detects long cycles', () => {
    expect(
      validateDependencyGraph(tasks, [
        ...edges,
        {
          taskId: 'research',
          dependsOnTaskId: 'submit',
          dependencyType: 'mandatory',
        },
      ]),
    ).toEqual({ valid: false, reason: 'cycle' });
  });

  it('rejects duplicate and missing relationships', () => {
    expect(validateDependencyGraph(tasks, [...edges, edges[0]!]).reason).toBe(
      'duplicate_dependency',
    );
    expect(
      validateDependencyGraph(tasks, [
        {
          taskId: 'missing',
          dependsOnTaskId: 'research',
          dependencyType: 'mandatory',
        },
      ]).reason,
    ).toBe('missing_task');
  });

  it('reports only unmet mandatory prerequisites', () => {
    expect(
      unmetMandatoryDependencies(
        'submit',
        [
          { id: 'research', status: 'completed' },
          { id: 'prepare', status: 'todo' },
          { id: 'submit', status: 'blocked' },
        ],
        edges,
      ),
    ).toEqual(['prepare']);
  });
});

describe('roadmap generation and regeneration', () => {
  it('creates verification work for missing dates instead of inventing one', () => {
    const result = generateRoadmap({
      profileMissing: [],
      nowDate: '2026-10-26',
      targets: [
        {
          ...target,
          deadline: {
            ...instantDeadline,
            precision: 'unknown',
            at: null,
            timezone: null,
            verified: false,
          },
        },
      ],
    });
    const verification = result.tasks.find((task) =>
      task.generationKey.endsWith('deadline:verify'),
    );
    expect(verification?.recommendedDueDate).toBeNull();
    expect(result.tasks.some((task) => task.officialDeadlineAt !== null)).toBe(
      false,
    );
  });

  it('selects test preparation only for a target-specific test gap', () => {
    const result = generateRoadmap({
      profileMissing: [],
      nowDate: '2026-10-26',
      targets: [
        {
          ...target,
          requirements: [
            {
              id: 21,
              title: 'English test',
              type: 'language',
              mandatory: true,
              status: 'NOT_MET',
              verification: 'verified',
              sourceUrl: 'https://example.edu/english',
              testCodes: ['IELTS'],
            },
          ],
        },
      ],
    });
    expect(
      result.tasks.find((task) => task.sourceRequirementId === 21)?.taskKind,
    ).toBe('test_preparation');
    expect(result.tasks.some((task) => task.title.includes('SAT'))).toBe(false);
  });

  it('maps unknown requirements to verification tasks', () => {
    const result = generateRoadmap({
      profileMissing: [],
      nowDate: '2026-10-26',
      targets: [
        {
          ...target,
          requirements: [
            {
              id: 22,
              title: 'Portfolio format',
              type: 'other',
              mandatory: true,
              status: 'UNKNOWN',
              verification: 'unverified',
              sourceUrl: null,
              testCodes: [],
            },
          ],
        },
      ],
    });
    expect(
      result.tasks.find((task) => task.sourceRequirementId === 22)?.taskKind,
    ).toBe('verify_requirement');
  });

  it('creates a separate scholarship step only from verified linkage', () => {
    const scholarship: RoadmapTargetInput = {
      ...target,
      catalogEntityId: 200,
      targetType: 'scholarship',
      detailPath: '/scholarships/example',
      scholarshipApplication: { linkage: 'separate', verified: true },
    };
    const result = generateRoadmap({
      profileMissing: [],
      targets: [scholarship],
      nowDate: '2026-10-26',
    });
    expect(
      result.tasks.find((task) =>
        task.generationKey.includes('application:prepare'),
      )?.title,
    ).toContain('separate scholarship');
  });

  it('generates a valid acyclic application chain', () => {
    const result = generateRoadmap({
      profileMissing: [],
      targets: [target],
      nowDate: '2026-10-26',
    });
    expect(
      validateDependencyGraph(
        result.tasks.map((task) => ({ id: task.generationKey })),
        result.dependencies.map((edge) => ({
          taskId: edge.taskKey,
          dependsOnTaskId: edge.dependsOnKey,
          dependencyType: edge.dependencyType,
        })),
      ).valid,
    ).toBe(true);
  });

  it('preserves completed state, notes, overrides, and manual tasks on regeneration', () => {
    const generated = generateRoadmap({
      profileMissing: [],
      targets: [target],
      nowDate: '2026-10-26',
    }).tasks;
    const first = generated[0]!;
    const previous: PersistedTask[] = [
      {
        ...first,
        id: 'existing',
        origin: 'generated',
        status: 'completed',
        note: 'Keep me',
        targetDate: '2026-11-01',
        priorityOverride: 'critical',
      },
      {
        ...first,
        id: 'manual',
        generationKey: '',
        origin: 'manual',
        status: 'todo',
        note: 'Manual',
        targetDate: null,
        priorityOverride: null,
      },
    ];
    const merged = mergeRoadmapTasks(previous, generated);
    expect(merged.find((task) => task.id === 'existing')).toMatchObject({
      status: 'completed',
      note: 'Keep me',
      targetDate: '2026-11-01',
      priorityOverride: 'critical',
    });
    expect(merged.some((task) => task.id === 'manual')).toBe(true);
  });
});

describe('roadmap progress and next action', () => {
  it('uses weighted progress', () => {
    expect(
      calculateProgress([
        { id: 'a', status: 'completed', weight: 2 },
        { id: 'b', status: 'todo', weight: 1 },
      ]),
    ).toEqual({ completed: 2, total: 3, percent: 67 });
  });

  it('never recommends a blocked dependent', () => {
    const tasks = [
      {
        id: 'a',
        title: 'Transcript',
        status: 'todo' as const,
        mandatory: true,
        priority: 'high' as const,
        dueDate: '2026-11-01',
      },
      {
        id: 'b',
        title: 'Submit',
        status: 'blocked' as const,
        mandatory: true,
        priority: 'critical' as const,
        dueDate: '2026-10-30',
      },
    ];
    const next = nextBestAction(
      tasks,
      [{ taskId: 'b', dependsOnTaskId: 'a', dependencyType: 'mandatory' }],
      '2026-10-26',
    );
    expect(next?.id).toBe('a');
  });
});
