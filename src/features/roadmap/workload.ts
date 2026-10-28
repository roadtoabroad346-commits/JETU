import { validateDependencyGraph, type TaskStatus } from './engine';

export type WorkloadTask = {
  id: string;
  status: TaskStatus;
  estimatedMinutes: number;
  mandatory: boolean;
  dueDate: string | null;
  officialDate: string | null;
};
type Edge = {
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: 'mandatory' | 'optional';
};

const dayMilliseconds = 86400000;
function day(value: string) {
  const result = Date.parse(`${value}T00:00:00Z`);
  if (
    !Number.isFinite(result) ||
    new Date(result).toISOString().slice(0, 10) !== value
  )
    throw new Error('Invalid planning date');
  return result;
}

/** Recomputed from saved tasks. Planning dates never modify official deadlines. */
export function planWeeklyWorkload(input: {
  tasks: WorkloadTask[];
  dependencies: Edge[];
  startDate: string;
  minutesPerWeek: number;
}) {
  const start = day(input.startDate);
  if (
    !Number.isInteger(input.minutesPerWeek) ||
    input.minutesPerWeek < 30 ||
    input.minutesPerWeek > 10080
  )
    throw new Error('Invalid weekly availability');
  for (const task of input.tasks) {
    if (
      !Number.isInteger(task.estimatedMinutes) ||
      task.estimatedMinutes < 1 ||
      task.estimatedMinutes > 10080
    )
      throw new Error('Invalid work estimate');
    if (task.dueDate) day(task.dueDate);
    if (task.officialDate) day(task.officialDate);
  }
  const pending = input.tasks.filter((task) => task.status !== 'completed');
  const done = new Set(
    input.tasks
      .filter((task) => task.status === 'completed')
      .map((task) => task.id),
  );
  const remaining = new Map(
    pending.map((task) => [task.id, task.estimatedMinutes]),
  );
  const completions = new Map<string, string>();
  const weeks: Array<{
    startDate: string;
    minutes: number;
    allocations: Array<{ taskId: string; minutes: number }>;
  }> = [];
  const prerequisites = new Map<string, string[]>();
  for (const edge of input.dependencies) {
    if (edge.dependencyType !== 'mandatory') continue;
    prerequisites.set(edge.taskId, [
      ...(prerequisites.get(edge.taskId) ?? []),
      edge.dependsOnTaskId,
    ]);
  }
  const validation = validateDependencyGraph(input.tasks, input.dependencies);
  const effectiveDates = new Map(
    input.tasks.map((task) => [
      task.id,
      task.dueDate ?? task.officialDate ?? '9999-12-31',
    ]),
  );
  // Urgent submissions make their required preparation urgent too.
  if (validation.valid) {
    for (const id of [...(validation.order ?? [])].reverse()) {
      for (const prerequisite of prerequisites.get(id) ?? []) {
        const inherited = effectiveDates.get(id)!;
        if (inherited < effectiveDates.get(prerequisite)!)
          effectiveDates.set(prerequisite, inherited);
      }
    }
  }
  const ordered = [...pending].sort(
    (a, b) =>
      effectiveDates.get(a.id)!.localeCompare(effectiveDates.get(b.id)!) ||
      Number(b.mandatory) - Number(a.mandatory) ||
      a.id.localeCompare(b.id),
  );
  // A finite two-year horizon bounds work even for malformed or infeasible plans.
  for (
    let offset = 0;
    validation.valid && offset < 728 && remaining.size;
    offset++
  ) {
    let available =
      Math.floor(input.minutesPerWeek / 7) +
      (offset % 7 < input.minutesPerWeek % 7 ? 1 : 0);
    const date = new Date(start + offset * dayMilliseconds)
      .toISOString()
      .slice(0, 10);
    while (available > 0) {
      const task = ordered.find(
        (candidate) =>
          remaining.has(candidate.id) &&
          (prerequisites.get(candidate.id) ?? []).every((id) => done.has(id)),
      );
      if (!task) break;
      const minutes = Math.min(available, remaining.get(task.id)!);
      const weekIndex = Math.floor(offset / 7);
      const week = weeks[weekIndex] ?? {
        startDate: new Date(start + weekIndex * 7 * dayMilliseconds)
          .toISOString()
          .slice(0, 10),
        minutes: 0,
        allocations: [],
      };
      weeks[weekIndex] = week;
      week.minutes += minutes;
      const allocation = week.allocations.find(
        (item) => item.taskId === task.id,
      );
      if (allocation) allocation.minutes += minutes;
      else week.allocations.push({ taskId: task.id, minutes });
      available -= minutes;
      const rest = remaining.get(task.id)! - minutes;
      if (rest) remaining.set(task.id, rest);
      else {
        remaining.delete(task.id);
        done.add(task.id);
        completions.set(task.id, date);
      }
    }
    if (
      !ordered.some(
        (task) =>
          remaining.has(task.id) &&
          (prerequisites.get(task.id) ?? []).every((id) => done.has(id)),
      )
    )
      break;
  }
  return {
    weeks: weeks.filter(Boolean),
    completions,
    unscheduledTaskIds: [...remaining.keys()],
    bufferRiskIds: pending
      .filter(
        (task) =>
          task.dueDate &&
          (completions.get(task.id) ?? '9999-12-31') > task.dueDate,
      )
      .map((task) => task.id),
    deadlineRiskIds: pending
      .filter(
        (task) =>
          task.officialDate &&
          (completions.get(task.id) ?? '9999-12-31') > task.officialDate,
      )
      .map((task) => task.id),
  };
}
