import { describe, expect, it } from 'vitest';
import {
  planWeeklyWorkload,
  type WorkloadTask,
} from '@/features/roadmap/workload';

const task = (id: string, minutes = 60): WorkloadTask => ({
  id,
  status: 'todo',
  estimatedMinutes: minutes,
  mandatory: true,
  dueDate: null,
  officialDate: null,
});
const input = (tasks: WorkloadTask[], minutesPerWeek = 60) => ({
  tasks,
  dependencies: [],
  startDate: '2026-10-28',
  minutesPerWeek,
});

describe('saved weekly workload planning', () => {
  it('inherits urgency through required preparation instead of starving a near submission', () => {
    const result = planWeeklyWorkload({
      ...input(
        [
          task('z-prepare', 30),
          { ...task('submit', 30), dueDate: '2026-10-30' },
          { ...task('a-later', 30), dueDate: '2026-11-01' },
        ],
        300,
      ),
      dependencies: [
        {
          taskId: 'submit',
          dependsOnTaskId: 'z-prepare',
          dependencyType: 'mandatory',
        },
      ],
    });
    expect(result.weeks[0]?.allocations.map((item) => item.taskId)).toEqual([
      'z-prepare',
      'submit',
      'a-later',
    ]);
  });
  it('splits long work across weeks without exceeding the student budget', () => {
    const result = planWeeklyWorkload(input([task('exam', 150)]));
    expect(result.weeks.map((week) => week.minutes)).toEqual([60, 60, 30]);
    expect(result.completions.get('exam')).toBe('2026-11-14');
    expect(result.unscheduledTaskIds).toEqual([]);
  });
  it('plans faster with more time and does not change the source deadlines', () => {
    const source = { ...task('exam', 150), officialDate: '2026-11-05' };
    expect(planWeeklyWorkload(input([source])).deadlineRiskIds).toEqual([
      'exam',
    ]);
    expect(planWeeklyWorkload(input([source], 300)).deadlineRiskIds).toEqual(
      [],
    );
    expect(source.officialDate).toBe('2026-11-05');
  });
  it('does not consume time on completed work and honors required prerequisites', () => {
    const result = planWeeklyWorkload({
      ...input(
        [
          { ...task('already', 10080), status: 'completed' },
          task('submit', 30),
          task('prepare', 60),
        ],
        30,
      ),
      dependencies: [
        {
          taskId: 'submit',
          dependsOnTaskId: 'prepare',
          dependencyType: 'mandatory',
        },
      ],
    });
    expect(result.weeks.reduce((sum, week) => sum + week.minutes, 0)).toBe(90);
    expect(
      result.completions.get('prepare')! <= result.completions.get('submit')!,
    ).toBe(true);
    expect(result.weeks[0]?.allocations.map((item) => item.taskId)).toEqual([
      'prepare',
    ]);
  });
  it('prioritizes earlier target dates even when another target was saved first', () => {
    const result = planWeeklyWorkload(
      input([
        { ...task('later'), dueDate: '2027-02-01' },
        { ...task('urgent'), dueDate: '2026-10-30' },
      ]),
    );
    expect(result.weeks[0]?.allocations[0]?.taskId).toBe('urgent');
    expect(result.bufferRiskIds).toEqual(['urgent']);
    expect(result.deadlineRiskIds).toEqual([]);
  });
  it('bounds infeasible plans and reports missing or cyclic dependencies', () => {
    const large = planWeeklyWorkload(input([task('exam', 10080)], 30));
    expect(large.weeks).toHaveLength(104);
    expect(large.unscheduledTaskIds).toEqual(['exam']);
    const broken = planWeeklyWorkload({
      ...input([task('submit')]),
      dependencies: [
        {
          taskId: 'submit',
          dependsOnTaskId: 'missing',
          dependencyType: 'mandatory',
        },
      ],
    });
    expect(broken.weeks).toEqual([]);
    expect(broken.unscheduledTaskIds).toEqual(['submit']);
  });
  it('ignores optional dependencies for scheduling and preserves total estimated effort', () => {
    const result = planWeeklyWorkload({
      ...input([task('a', 30), task('b', 40)], 61),
      dependencies: [
        { taskId: 'a', dependsOnTaskId: 'b', dependencyType: 'optional' },
      ],
    });
    expect(result.weeks[0]?.allocations[0]?.taskId).toBe('a');
    expect(result.weeks.reduce((sum, week) => sum + week.minutes, 0)).toBe(70);
    expect(result.weeks.every((week) => week.minutes <= 61)).toBe(true);
  });
  it('rejects invalid dates, capacity and estimates before scheduling', () => {
    expect(() =>
      planWeeklyWorkload({ ...input([]), startDate: '2026-02-30' }),
    ).toThrow();
    expect(() => planWeeklyWorkload(input([task('a')], 0))).toThrow();
    expect(() => planWeeklyWorkload(input([task('a', Number.NaN)]))).toThrow();
  });
});
