export const ROADMAP_GENERATION_VERSION = 'roadmap-v1';

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type DeadlinePrecision = 'instant' | 'date_only' | 'rolling' | 'unknown';
export type TaskKind =
  | 'research'
  | 'verify_requirement'
  | 'academic_preparation'
  | 'test_preparation'
  | 'document'
  | 'recommendation'
  | 'essay'
  | 'fee'
  | 'application'
  | 'interview'
  | 'decision'
  | 'visa'
  | 'enrollment'
  | 'scholarship'
  | 'other';

export type OfficialDeadline = {
  id: number | null;
  precision: DeadlinePrecision;
  at: string | null;
  date: string | null;
  timezone: string | null;
  sourceUrl: string | null;
  sourceCheckedAt: string | null;
  verified: boolean;
};

export type RoadmapRequirement = {
  id: number;
  title: string;
  type: string;
  mandatory: boolean;
  status: 'MET' | 'NOT_MET' | 'UNKNOWN' | 'NOT_APPLICABLE';
  verification: 'verified' | 'unverified' | 'stale' | 'conflicted';
  sourceUrl: string | null;
  testCodes: string[];
};

export type RoadmapDocumentRequirement = {
  id: number;
  name: string;
  state: 'required' | 'conditional' | 'optional' | 'unknown';
  verified: boolean;
  sourceUrl: string | null;
};

export type RoadmapTargetInput = {
  catalogEntityId: number;
  targetType: 'program' | 'scholarship';
  title: string;
  detailPath: string;
  deadline: OfficialDeadline;
  requirements: RoadmapRequirement[];
  documents: RoadmapDocumentRequirement[];
  scholarshipApplication: {
    linkage: 'separate' | 'with_admission' | 'after_admission';
    verified: true;
  } | null;
};

export type GeneratedMilestone = {
  generationKey: string;
  targetCatalogId: number | null;
  title: string;
  description: string;
  sequence: number;
  recommendedDate: string | null;
};

export type GeneratedTask = {
  generationKey: string;
  milestoneKey: string;
  targetCatalogId: number | null;
  taskKind: TaskKind;
  title: string;
  description: string;
  whyItMatters: string;
  priority: TaskPriority;
  mandatory: boolean;
  officialDeadlineAt: string | null;
  officialDeadlineDate: string | null;
  deadlinePrecision: DeadlinePrecision;
  deadlineTimezone: string | null;
  sourceUrl: string | null;
  sourceCheckedAt: string | null;
  recommendedDueDate: string | null;
  estimatedMinutes: number;
  sourceRequirementId: number | null;
  sourceDeadlineId: number | null;
};

export type GeneratedDependency = {
  taskKey: string;
  dependsOnKey: string;
  dependencyType: 'mandatory' | 'optional';
};

export type RoadmapTemplates = {
  profileMilestone: string;
  profileTask: (fields: string) => string;
  profileDescription: string;
  selectTarget: string;
  selectTargetDescription: string;
  preparationMilestone: (target: string) => string;
  submissionMilestone: (target: string) => string;
  postDecisionMilestone: (target: string) => string;
  research: (target: string) => string;
  researchWhy: string;
  confirmRequirements: string;
  confirmRequirementsWhy: string;
  verifyDeadline: string;
  verifyDeadlineWhy: string;
  verifyRequirement: (requirement: string) => string;
  closeGap: (requirement: string) => string;
  prepareTest: (tests: string) => string;
  requirementWhy: string;
  verifyDocuments: string;
  prepareDocument: (document: string) => string;
  documentsWhy: string;
  prepareApplication: string;
  reviewApplication: string;
  submitApplication: string;
  separateScholarship: string;
  trackDecision: string;
  interviewCheck: string;
  visaCheck: string;
  enrollmentCheck: string;
  applicationWhy: string;
  postDecisionWhy: string;
};

export const englishRoadmapTemplates: RoadmapTemplates = {
  profileMilestone: 'Build a complete planning profile',
  profileTask: (fields) => `Complete profile fields: ${fields}`,
  profileDescription:
    'The roadmap can only personalize verified gaps when the relevant profile fields are present.',
  selectTarget: 'Choose at least one saved program or scholarship',
  selectTargetDescription:
    'Save a verified target, then return to generate its specific admissions path.',
  preparationMilestone: (target) => `Prepare for ${target}`,
  submissionMilestone: (target) => `Application for ${target}`,
  postDecisionMilestone: (target) => `After the decision: ${target}`,
  research: (target) => `Review the official ${target} page`,
  researchWhy:
    'Starting from the official source keeps later tasks tied to current evidence.',
  confirmRequirements: 'Confirm current admissions requirements',
  confirmRequirementsWhy:
    'Requirements can change between cycles and must be confirmed before preparation.',
  verifyDeadline: 'Verify the official application deadline',
  verifyDeadlineWhy:
    'No current verified cutoff is available, so the roadmap must not invent one.',
  verifyRequirement: (requirement) => `Verify requirement: ${requirement}`,
  closeGap: (requirement) => `Plan how to address: ${requirement}`,
  prepareTest: (tests) => `Prepare and verify ${tests}`,
  requirementWhy:
    'This action follows a target-specific requirement or an unresolved evidence gap.',
  verifyDocuments: 'Confirm the required document list',
  prepareDocument: (document) => `Prepare ${document}`,
  documentsWhy:
    'The application should only use documents confirmed by the official target workflow.',
  prepareApplication: 'Prepare the application materials',
  reviewApplication: 'Review the application against confirmed requirements',
  submitApplication: 'Submit through the official application channel',
  separateScholarship: 'Complete the separate scholarship application',
  trackDecision: 'Track the official admissions decision',
  interviewCheck: 'Check whether an interview is requested',
  visaCheck: 'Verify visa steps after an offer',
  enrollmentCheck: 'Verify enrollment instructions after an offer',
  applicationWhy:
    'This step is part of the selected target’s application path.',
  postDecisionWhy:
    'This conditional step becomes relevant only after an official decision or offer.',
};

function validDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

export function isIanaTimezone(value: string | null) {
  if (!value) return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

function dateInZone(instant: string, timezone: string) {
  const parsed = new Date(instant);
  if (!Number.isFinite(parsed.getTime()) || !isIanaTimezone(timezone))
    return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(parsed);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;
  const value = `${part('year')}-${part('month')}-${part('day')}`;
  return validDate(value) ? value : null;
}

export function normalizeOfficialDeadline(deadline: OfficialDeadline) {
  if (deadline.precision === 'instant') {
    const at = deadline.at ? new Date(deadline.at) : null;
    if (
      !at ||
      !Number.isFinite(at.getTime()) ||
      !isIanaTimezone(deadline.timezone)
    )
      return {
        ...deadline,
        precision: 'unknown' as const,
        at: null,
        date: null,
      };
    return { ...deadline, date: null };
  }
  if (deadline.precision === 'date_only' && validDate(deadline.date))
    return { ...deadline, at: null };
  if (deadline.precision === 'rolling')
    return { ...deadline, at: null, date: null };
  return { ...deadline, precision: 'unknown' as const, at: null, date: null };
}

export function officialDeadlineDate(deadline: OfficialDeadline) {
  const normalized = normalizeOfficialDeadline(deadline);
  if (normalized.precision === 'date_only') return normalized.date;
  if (
    normalized.precision === 'instant' &&
    normalized.at &&
    normalized.timezone
  )
    return dateInZone(normalized.at, normalized.timezone);
  return null;
}

export function subtractCalendarDays(value: string | null, days: number) {
  if (!validDate(value) || !Number.isInteger(days) || days < 0) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() - days);
  return parsed.toISOString().slice(0, 10);
}

export function priorityForTask(input: {
  mandatory: boolean;
  dueDate: string | null;
  nowDate: string;
  blocked?: boolean;
}): TaskPriority {
  if (!input.dueDate || !validDate(input.nowDate))
    return input.mandatory ? 'medium' : 'low';
  const days = Math.floor(
    (new Date(`${input.dueDate}T00:00:00Z`).getTime() -
      new Date(`${input.nowDate}T00:00:00Z`).getTime()) /
      86400000,
  );
  if (days < 0 || (input.mandatory && days <= 7)) return 'critical';
  if (input.mandatory && days <= 30) return 'high';
  if (days <= 60 || input.blocked) return 'medium';
  return input.mandatory ? 'medium' : 'low';
}

type GraphTask = { id: string; status?: TaskStatus; weight?: number };
type GraphEdge = {
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: 'mandatory' | 'optional';
};

export function validateDependencyGraph(
  tasks: GraphTask[],
  edges: GraphEdge[],
) {
  const ids = new Set(tasks.map((task) => task.id));
  if (ids.size !== tasks.length)
    return { valid: false, reason: 'duplicate_task' as const };
  const pairs = new Set<string>();
  for (const edge of edges) {
    if (!ids.has(edge.taskId) || !ids.has(edge.dependsOnTaskId))
      return { valid: false, reason: 'missing_task' as const };
    if (edge.taskId === edge.dependsOnTaskId)
      return { valid: false, reason: 'self_dependency' as const };
    const pair = `${edge.taskId}:${edge.dependsOnTaskId}`;
    if (pairs.has(pair))
      return { valid: false, reason: 'duplicate_dependency' as const };
    pairs.add(pair);
  }
  const order = topologicalOrder(tasks, edges);
  return order.length === tasks.length
    ? { valid: true as const, order }
    : { valid: false as const, reason: 'cycle' as const };
}

export function topologicalOrder(tasks: GraphTask[], edges: GraphEdge[]) {
  const incoming = new Map(tasks.map((task) => [task.id, 0]));
  const outgoing = new Map(tasks.map((task) => [task.id, [] as string[]]));
  for (const edge of edges) {
    if (!incoming.has(edge.taskId) || !incoming.has(edge.dependsOnTaskId))
      continue;
    incoming.set(edge.taskId, (incoming.get(edge.taskId) ?? 0) + 1);
    outgoing.get(edge.dependsOnTaskId)?.push(edge.taskId);
  }
  const ready = [...incoming.entries()]
    .filter(([, count]) => count === 0)
    .map(([id]) => id)
    .sort();
  const result: string[] = [];
  while (ready.length) {
    const id = ready.shift()!;
    result.push(id);
    for (const dependent of outgoing.get(id) ?? []) {
      const count = (incoming.get(dependent) ?? 0) - 1;
      incoming.set(dependent, count);
      if (count === 0) ready.push(dependent);
    }
    ready.sort();
  }
  return result;
}

export function unmetMandatoryDependencies(
  taskId: string,
  tasks: GraphTask[],
  edges: GraphEdge[],
) {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  return edges
    .filter(
      (edge) => edge.taskId === taskId && edge.dependencyType === 'mandatory',
    )
    .filter((edge) => byId.get(edge.dependsOnTaskId)?.status !== 'completed')
    .map((edge) => edge.dependsOnTaskId);
}

export function calculateProgress(tasks: GraphTask[]) {
  const active = tasks.filter((task) => (task.weight ?? 1) > 0);
  const total = active.reduce((sum, task) => sum + (task.weight ?? 1), 0);
  const completed = active
    .filter((task) => task.status === 'completed')
    .reduce((sum, task) => sum + (task.weight ?? 1), 0);
  return {
    completed,
    total,
    percent: total ? Math.round((completed / total) * 100) : 0,
  };
}

export function nextBestAction<
  T extends GraphTask & {
    title: string;
    mandatory: boolean;
    priority: TaskPriority;
    dueDate: string | null;
  },
>(tasks: T[], edges: GraphEdge[], nowDate: string) {
  const score = (task: T) => {
    const priority = { low: 10, medium: 25, high: 50, critical: 80 }[
      task.priority
    ];
    const due =
      task.dueDate && validDate(task.dueDate)
        ? Math.max(
            0,
            40 -
              Math.floor(
                (new Date(`${task.dueDate}T00:00:00Z`).getTime() -
                  new Date(`${nowDate}T00:00:00Z`).getTime()) /
                  86400000,
              ),
          )
        : 0;
    return priority + due + (task.mandatory ? 20 : 0);
  };
  return (
    tasks
      .filter((task) => task.status !== 'completed')
      .filter(
        (task) =>
          unmetMandatoryDependencies(task.id, tasks, edges).length === 0,
      )
      .sort(
        (left, right) =>
          score(right) - score(left) || left.title.localeCompare(right.title),
      )[0] ?? null
  );
}

function taskDeadlineFields(deadline: OfficialDeadline) {
  const normalized = normalizeOfficialDeadline(deadline);
  return {
    officialDeadlineAt:
      normalized.precision === 'instant' ? normalized.at : null,
    officialDeadlineDate:
      normalized.precision === 'date_only' ? normalized.date : null,
    deadlinePrecision: normalized.precision,
    deadlineTimezone: normalized.timezone,
    sourceUrl: normalized.sourceUrl,
    sourceCheckedAt: normalized.sourceCheckedAt,
    sourceDeadlineId: normalized.id,
  };
}

export function generateRoadmap(input: {
  profileMissing: string[];
  targets: RoadmapTargetInput[];
  nowDate: string;
  templates?: RoadmapTemplates;
}) {
  const text = input.templates ?? englishRoadmapTemplates;
  const milestones: GeneratedMilestone[] = [];
  const tasks: GeneratedTask[] = [];
  const dependencies: GeneratedDependency[] = [];
  const addTask = (task: GeneratedTask) => tasks.push(task);
  const depend = (
    taskKey: string,
    dependsOnKey: string,
    type: 'mandatory' | 'optional' = 'mandatory',
  ) => dependencies.push({ taskKey, dependsOnKey, dependencyType: type });

  const profileMilestone = 'profile:ready';
  milestones.push({
    generationKey: profileMilestone,
    targetCatalogId: null,
    title: text.profileMilestone,
    description: text.profileDescription,
    sequence: 0,
    recommendedDate: null,
  });
  if (input.profileMissing.length) {
    addTask({
      generationKey: 'profile:complete',
      milestoneKey: profileMilestone,
      targetCatalogId: null,
      taskKind: 'other',
      title: text.profileTask(input.profileMissing.join(', ')),
      description: text.profileDescription,
      whyItMatters: text.profileDescription,
      priority: 'high',
      mandatory: true,
      officialDeadlineAt: null,
      officialDeadlineDate: null,
      deadlinePrecision: 'unknown',
      deadlineTimezone: null,
      sourceUrl: null,
      sourceCheckedAt: null,
      recommendedDueDate: null,
      estimatedMinutes: 20,
      sourceRequirementId: null,
      sourceDeadlineId: null,
    });
  }
  if (!input.targets.length) {
    addTask({
      generationKey: 'targets:select',
      milestoneKey: profileMilestone,
      targetCatalogId: null,
      taskKind: 'research',
      title: text.selectTarget,
      description: text.selectTargetDescription,
      whyItMatters: text.selectTargetDescription,
      priority: 'high',
      mandatory: true,
      officialDeadlineAt: null,
      officialDeadlineDate: null,
      deadlinePrecision: 'unknown',
      deadlineTimezone: null,
      sourceUrl: null,
      sourceCheckedAt: null,
      recommendedDueDate: null,
      estimatedMinutes: 45,
      sourceRequirementId: null,
      sourceDeadlineId: null,
    });
    if (input.profileMissing.length)
      depend('targets:select', 'profile:complete');
  }

  input.targets.forEach((target, targetIndex) => {
    const prefix = `${target.targetType}:${target.catalogEntityId}`;
    const prepareMilestone = `${prefix}:prepare`;
    const submitMilestone = `${prefix}:submit`;
    const postMilestone = `${prefix}:post`;
    const officialDate = officialDeadlineDate(target.deadline);
    milestones.push(
      {
        generationKey: prepareMilestone,
        targetCatalogId: target.catalogEntityId,
        title: text.preparationMilestone(target.title),
        description: text.confirmRequirementsWhy,
        sequence: 100 + targetIndex * 10,
        recommendedDate: subtractCalendarDays(officialDate, 56),
      },
      {
        generationKey: submitMilestone,
        targetCatalogId: target.catalogEntityId,
        title: text.submissionMilestone(target.title),
        description: text.applicationWhy,
        sequence: 101 + targetIndex * 10,
        recommendedDate: subtractCalendarDays(officialDate, 7),
      },
      {
        generationKey: postMilestone,
        targetCatalogId: target.catalogEntityId,
        title: text.postDecisionMilestone(target.title),
        description: text.postDecisionWhy,
        sequence: 102 + targetIndex * 10,
        recommendedDate: null,
      },
    );
    const deadline = taskDeadlineFields(target.deadline);
    const researchKey = `${prefix}:research`;
    const requirementsKey = `${prefix}:requirements`;
    const documentsKey = `${prefix}:documents`;
    const prepareKey = `${prefix}:application:prepare`;
    const reviewKey = `${prefix}:application:review`;
    const submitKey = `${prefix}:application:submit`;
    addTask({
      generationKey: researchKey,
      milestoneKey: prepareMilestone,
      targetCatalogId: target.catalogEntityId,
      taskKind: 'research',
      title: text.research(target.title),
      description: target.title,
      whyItMatters: text.researchWhy,
      priority: priorityForTask({
        mandatory: true,
        dueDate: subtractCalendarDays(officialDate, 84),
        nowDate: input.nowDate,
      }),
      mandatory: true,
      officialDeadlineAt: null,
      officialDeadlineDate: null,
      deadlinePrecision: 'unknown',
      deadlineTimezone: null,
      sourceUrl: target.deadline.sourceUrl,
      sourceCheckedAt: target.deadline.sourceCheckedAt,
      recommendedDueDate: subtractCalendarDays(officialDate, 84),
      estimatedMinutes: 45,
      sourceRequirementId: null,
      sourceDeadlineId: null,
    });
    addTask({
      generationKey: requirementsKey,
      milestoneKey: prepareMilestone,
      targetCatalogId: target.catalogEntityId,
      taskKind: 'verify_requirement',
      title: text.confirmRequirements,
      description: target.title,
      whyItMatters: text.confirmRequirementsWhy,
      priority: 'high',
      mandatory: true,
      officialDeadlineAt: null,
      officialDeadlineDate: null,
      deadlinePrecision: 'unknown',
      deadlineTimezone: null,
      sourceUrl: target.deadline.sourceUrl,
      sourceCheckedAt: target.deadline.sourceCheckedAt,
      recommendedDueDate: subtractCalendarDays(officialDate, 70),
      estimatedMinutes: 60,
      sourceRequirementId: null,
      sourceDeadlineId: null,
    });
    depend(requirementsKey, researchKey);
    if (input.profileMissing.length) depend(researchKey, 'profile:complete');

    const gapKeys: string[] = [];
    for (const requirement of target.requirements) {
      if (
        requirement.status === 'MET' ||
        requirement.status === 'NOT_APPLICABLE'
      )
        continue;
      const requirementKey = `${prefix}:requirement:${requirement.id}`;
      const test = requirement.testCodes.length > 0;
      const verified =
        requirement.verification === 'verified' &&
        Boolean(requirement.sourceUrl);
      const kind: TaskKind =
        !verified || requirement.status === 'UNKNOWN'
          ? 'verify_requirement'
          : test
            ? 'test_preparation'
            : requirement.type === 'academic'
              ? 'academic_preparation'
              : 'verify_requirement';
      const title =
        !verified || requirement.status === 'UNKNOWN'
          ? text.verifyRequirement(requirement.title)
          : test
            ? text.prepareTest(requirement.testCodes.join(' / '))
            : text.closeGap(requirement.title);
      addTask({
        generationKey: requirementKey,
        milestoneKey: prepareMilestone,
        targetCatalogId: target.catalogEntityId,
        taskKind: kind,
        title,
        description: requirement.title,
        whyItMatters: text.requirementWhy,
        priority: priorityForTask({
          mandatory: requirement.mandatory,
          dueDate: subtractCalendarDays(officialDate, 42),
          nowDate: input.nowDate,
        }),
        mandatory: requirement.mandatory,
        officialDeadlineAt: null,
        officialDeadlineDate: null,
        deadlinePrecision: 'unknown',
        deadlineTimezone: null,
        sourceUrl: requirement.sourceUrl,
        sourceCheckedAt: null,
        recommendedDueDate: subtractCalendarDays(officialDate, 42),
        estimatedMinutes: test ? 1200 : 120,
        sourceRequirementId: requirement.id,
        sourceDeadlineId: null,
      });
      depend(
        requirementKey,
        requirementsKey,
        requirement.mandatory ? 'mandatory' : 'optional',
      );
      if (requirement.mandatory) gapKeys.push(requirementKey);
    }

    if (!target.deadline.verified || target.deadline.precision === 'unknown') {
      const key = `${prefix}:deadline:verify`;
      addTask({
        generationKey: key,
        milestoneKey: prepareMilestone,
        targetCatalogId: target.catalogEntityId,
        taskKind: 'verify_requirement',
        title: text.verifyDeadline,
        description: target.title,
        whyItMatters: text.verifyDeadlineWhy,
        priority: 'high',
        mandatory: true,
        officialDeadlineAt: null,
        officialDeadlineDate: null,
        deadlinePrecision: 'unknown',
        deadlineTimezone: null,
        sourceUrl: target.deadline.sourceUrl,
        sourceCheckedAt: target.deadline.sourceCheckedAt,
        recommendedDueDate: null,
        estimatedMinutes: 30,
        sourceRequirementId: null,
        sourceDeadlineId: target.deadline.id,
      });
      depend(key, researchKey);
      gapKeys.push(key);
    }

    addTask({
      generationKey: documentsKey,
      milestoneKey: prepareMilestone,
      targetCatalogId: target.catalogEntityId,
      taskKind: 'document',
      title: target.documents.length
        ? text.verifyDocuments
        : text.verifyDocuments,
      description: target.title,
      whyItMatters: text.documentsWhy,
      priority: 'high',
      mandatory: true,
      officialDeadlineAt: null,
      officialDeadlineDate: null,
      deadlinePrecision: 'unknown',
      deadlineTimezone: null,
      sourceUrl: target.deadline.sourceUrl,
      sourceCheckedAt: target.deadline.sourceCheckedAt,
      recommendedDueDate: subtractCalendarDays(officialDate, 56),
      estimatedMinutes: 45,
      sourceRequirementId: null,
      sourceDeadlineId: null,
    });
    depend(documentsKey, requirementsKey);
    const documentKeys: string[] = [];
    for (const document of target.documents) {
      const key = `${prefix}:document:${document.id}`;
      const mandatory = document.state === 'required';
      addTask({
        generationKey: key,
        milestoneKey: prepareMilestone,
        targetCatalogId: target.catalogEntityId,
        taskKind: 'document',
        title: document.verified
          ? text.prepareDocument(document.name)
          : text.verifyRequirement(document.name),
        description: document.name,
        whyItMatters: text.documentsWhy,
        priority: mandatory ? 'high' : 'medium',
        mandatory,
        officialDeadlineAt: null,
        officialDeadlineDate: null,
        deadlinePrecision: 'unknown',
        deadlineTimezone: null,
        sourceUrl: document.sourceUrl,
        sourceCheckedAt: null,
        recommendedDueDate: subtractCalendarDays(officialDate, 35),
        estimatedMinutes: 120,
        sourceRequirementId: null,
        sourceDeadlineId: null,
      });
      depend(key, documentsKey, mandatory ? 'mandatory' : 'optional');
      if (mandatory) documentKeys.push(key);
    }

    addTask({
      generationKey: prepareKey,
      milestoneKey: submitMilestone,
      targetCatalogId: target.catalogEntityId,
      taskKind:
        target.targetType === 'scholarship' ? 'scholarship' : 'application',
      title:
        target.scholarshipApplication?.linkage === 'separate'
          ? text.separateScholarship
          : text.prepareApplication,
      description: target.title,
      whyItMatters: text.applicationWhy,
      priority: priorityForTask({
        mandatory: true,
        dueDate: subtractCalendarDays(officialDate, 21),
        nowDate: input.nowDate,
      }),
      mandatory: true,
      officialDeadlineAt: null,
      officialDeadlineDate: null,
      deadlinePrecision: 'unknown',
      deadlineTimezone: null,
      sourceUrl: target.deadline.sourceUrl,
      sourceCheckedAt: target.deadline.sourceCheckedAt,
      recommendedDueDate: subtractCalendarDays(officialDate, 21),
      estimatedMinutes: 300,
      sourceRequirementId: null,
      sourceDeadlineId: null,
    });
    depend(prepareKey, documentsKey);
    for (const key of [...gapKeys, ...documentKeys]) depend(prepareKey, key);
    addTask({
      generationKey: reviewKey,
      milestoneKey: submitMilestone,
      targetCatalogId: target.catalogEntityId,
      taskKind: 'application',
      title: text.reviewApplication,
      description: target.title,
      whyItMatters: text.applicationWhy,
      priority: 'high',
      mandatory: true,
      officialDeadlineAt: null,
      officialDeadlineDate: null,
      deadlinePrecision: 'unknown',
      deadlineTimezone: null,
      sourceUrl: target.deadline.sourceUrl,
      sourceCheckedAt: target.deadline.sourceCheckedAt,
      recommendedDueDate: subtractCalendarDays(officialDate, 7),
      estimatedMinutes: 120,
      sourceRequirementId: null,
      sourceDeadlineId: null,
    });
    depend(reviewKey, prepareKey);
    addTask({
      generationKey: submitKey,
      milestoneKey: submitMilestone,
      targetCatalogId: target.catalogEntityId,
      taskKind: 'application',
      title: text.submitApplication,
      description: target.title,
      whyItMatters: text.applicationWhy,
      priority: priorityForTask({
        mandatory: true,
        dueDate: subtractCalendarDays(officialDate, 3),
        nowDate: input.nowDate,
      }),
      mandatory: true,
      ...deadline,
      recommendedDueDate: subtractCalendarDays(officialDate, 3),
      estimatedMinutes: 45,
      sourceRequirementId: null,
    });
    depend(submitKey, reviewKey);

    const decisionKey = `${prefix}:decision`;
    addTask({
      generationKey: decisionKey,
      milestoneKey: postMilestone,
      targetCatalogId: target.catalogEntityId,
      taskKind: 'decision',
      title: text.trackDecision,
      description: target.title,
      whyItMatters: text.postDecisionWhy,
      priority: 'low',
      mandatory: false,
      officialDeadlineAt: null,
      officialDeadlineDate: null,
      deadlinePrecision: 'unknown',
      deadlineTimezone: null,
      sourceUrl: target.deadline.sourceUrl,
      sourceCheckedAt: target.deadline.sourceCheckedAt,
      recommendedDueDate: null,
      estimatedMinutes: 20,
      sourceRequirementId: null,
      sourceDeadlineId: null,
    });
    depend(decisionKey, submitKey, 'optional');
    for (const [suffix, kind, title] of [
      ['interview', 'interview', text.interviewCheck],
      ['visa', 'visa', text.visaCheck],
      ['enrollment', 'enrollment', text.enrollmentCheck],
    ] as const) {
      const key = `${prefix}:${suffix}`;
      addTask({
        generationKey: key,
        milestoneKey: postMilestone,
        targetCatalogId: target.catalogEntityId,
        taskKind: kind,
        title,
        description: target.title,
        whyItMatters: text.postDecisionWhy,
        priority: 'low',
        mandatory: false,
        officialDeadlineAt: null,
        officialDeadlineDate: null,
        deadlinePrecision: 'unknown',
        deadlineTimezone: null,
        sourceUrl: target.deadline.sourceUrl,
        sourceCheckedAt: target.deadline.sourceCheckedAt,
        recommendedDueDate: null,
        estimatedMinutes: 30,
        sourceRequirementId: null,
        sourceDeadlineId: null,
      });
      depend(key, decisionKey, 'optional');
    }
  });

  const validation = validateDependencyGraph(
    tasks.map((task) => ({ id: task.generationKey })),
    dependencies.map((edge) => ({
      taskId: edge.taskKey,
      dependsOnTaskId: edge.dependsOnKey,
      dependencyType: edge.dependencyType,
    })),
  );
  if (!validation.valid)
    throw new Error(`Invalid generated roadmap graph: ${validation.reason}`);
  return { milestones, tasks, dependencies };
}

export type PersistedTask = GeneratedTask & {
  id: string;
  origin: 'generated' | 'manual';
  status: TaskStatus;
  note: string | null;
  targetDate: string | null;
  priorityOverride: TaskPriority | null;
};

export function mergeRoadmapTasks(
  previous: PersistedTask[],
  generated: GeneratedTask[],
) {
  const byKey = new Map(
    previous
      .filter((task) => task.origin === 'generated')
      .map((task) => [task.generationKey, task]),
  );
  const next = generated.map((task) => {
    const existing = byKey.get(task.generationKey);
    return existing
      ? {
          ...task,
          id: existing.id,
          origin: 'generated' as const,
          status: existing.status,
          note: existing.note,
          targetDate: existing.targetDate,
          priorityOverride: existing.priorityOverride,
        }
      : {
          ...task,
          id: `new:${task.generationKey}`,
          origin: 'generated' as const,
          status: 'todo' as const,
          note: null,
          targetDate: null,
          priorityOverride: null,
        };
  });
  return [...previous.filter((task) => task.origin === 'manual'), ...next];
}
