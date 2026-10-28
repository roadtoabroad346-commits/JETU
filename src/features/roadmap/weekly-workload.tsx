'use client';

import type { Locale } from '@/lib/i18n/messages';
import type { RoadmapState } from './service';
import { officialDeadlineDate } from './engine';
import { planWeeklyWorkload } from './workload';

const copy = {
  en: {
    title: 'Your weekly workload',
    explanation:
      'Estimated work is spread over seven-day weeks from today, within your saved availability. Completed work is excluded; conditional post-decision steps wait until you start or date them. These are planning estimates, not official deadlines.',
    minutes: 'min',
    empty: 'No active preparation work to schedule.',
    risk: 'At this pace, these tasks miss an internal or personal target date:',
    official: 'The estimated work does not fit before the official deadline:',
    blocked:
      'Some tasks cannot fit within two years or have unresolved dependencies. Review them before relying on the schedule.',
    more: 'Show later weeks',
  },
  ru: {
    title: 'Нагрузка по неделям',
    explanation:
      'Работа распределена на семидневные недели от сегодня в пределах сохранённого времени. Завершённые задачи исключены; условные шаги после решения ждут начала работы или выбранной вами даты. Это оценки планирования, а не официальные дедлайны.',
    minutes: 'мин',
    empty: 'Нет активных задач подготовки для расписания.',
    risk: 'При таком темпе эти задачи не укладываются во внутреннюю или личную дату:',
    official: 'По оценке работа не укладывается до официального дедлайна:',
    blocked:
      'Часть задач не помещается в два года или имеет незакрытые зависимости. Проверьте их перед использованием расписания.',
    more: 'Показать следующие недели',
  },
  kk: {
    title: 'Апталық жүктеме',
    explanation:
      'Жұмыс бүгіннен бастап жеті күндік апталарға, сақталған уақыт шегінде бөлінеді. Аяқталған тапсырмалар есептелмейді; шешімнен кейінгі шартты қадамдар басталғанша немесе өз күніңіз белгіленгенше күтеді. Бұл ресми мерзімдер емес, жоспарлау бағалары.',
    minutes: 'мин',
    empty: 'Жоспарлайтын белсенді дайындық тапсырмалары жоқ.',
    risk: 'Осы қарқынмен мына тапсырмалар ішкі немесе жеке күнге дейін бітпейді:',
    official: 'Есеп бойынша жұмыс ресми мерзімге дейін аяқталмайды:',
    blocked:
      'Кейбір тапсырмалар екі жылға сыймайды немесе тәуелділіктері шешілмеген. Кестеге сүйенбес бұрын оларды тексеріңіз.',
    more: 'Кейінгі апталарды көрсету',
  },
} as const;

export function WeeklyWorkload({
  state,
  locale,
  onOpen,
}: {
  state: RoadmapState;
  locale: Locale;
  onOpen: (task: RoadmapState['tasks'][number]) => void;
}) {
  const t = copy[locale];
  if (!state.roadmap) return null;
  const zone = state.roadmap.timezone;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) =>
    parts.find((value) => value.type === type)!.value;
  const startDate = `${part('year')}-${part('month')}-${part('day')}`;
  const tasks = state.tasks.filter(
    (task) =>
      !task.obsoleteAt &&
      (!['decision', 'interview', 'visa', 'enrollment'].includes(
        task.taskKind,
      ) ||
        task.status === 'completed' ||
        task.status === 'in_progress' ||
        task.targetDate),
  );
  const included = new Set(tasks.map((task) => task.id));
  const plan = planWeeklyWorkload({
    startDate,
    minutesPerWeek: state.roadmap.availabilityMinutesPerWeek,
    tasks: tasks.map((task) => ({
      id: task.id,
      status: task.status,
      estimatedMinutes: task.estimatedMinutes,
      mandatory: task.mandatory,
      dueDate: task.targetDate ?? task.recommendedDueDate,
      officialDate: officialDeadlineDate({
        id: null,
        precision: task.deadlinePrecision,
        at: task.officialDeadlineAt,
        date: task.officialDeadlineDate,
        timezone: task.deadlineTimezone,
        sourceUrl: null,
        sourceCheckedAt: null,
        verified: true,
      }),
    })),
    dependencies: state.dependencies.filter((edge) =>
      included.has(edge.taskId),
    ),
  });
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const renderTasks = (ids: string[]) => (
    <ul>
      {ids.map((id) => {
        const task = taskById.get(id);
        return task ? (
          <li key={id}>
            <button
              type="button"
              className="ui-button ui-button--secondary"
              onClick={() => onOpen(task)}
            >
              {task.title}
            </button>
          </li>
        ) : null;
      })}
    </ul>
  );
  const weekList = (weeks: typeof plan.weeks) => (
    <ol className="roadmap-week-list">
      {weeks.map((week) => (
        <li key={week.startDate}>
          <h3>
            {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
              new Date(`${week.startDate}T12:00:00Z`),
            )}
          </h3>
          <p>
            {week.minutes} / {state.roadmap!.availabilityMinutesPerWeek}{' '}
            {t.minutes}
          </p>
          <ul>
            {week.allocations.map((allocation) => (
              <li key={allocation.taskId}>
                {taskById.get(allocation.taskId)?.title}: {allocation.minutes}{' '}
                {t.minutes}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
  return (
    <section
      className="roadmap-upcoming roadmap-workload"
      aria-labelledby="weekly-workload-title"
    >
      <h2 id="weekly-workload-title">{t.title}</h2>
      <p>{t.explanation}</p>
      {plan.deadlineRiskIds.length > 0 && (
        <div className="feedback-box feedback-box--error">
          <p>{t.official}</p>
          {renderTasks(plan.deadlineRiskIds)}
        </div>
      )}
      {plan.bufferRiskIds.length > 0 && (
        <div className="feedback-box">
          <p>{t.risk}</p>
          {renderTasks(plan.bufferRiskIds)}
        </div>
      )}
      {plan.unscheduledTaskIds.length > 0 && (
        <p className="feedback-box">{t.blocked}</p>
      )}
      {plan.weeks.length ? weekList(plan.weeks.slice(0, 8)) : <p>{t.empty}</p>}
      {plan.weeks.length > 8 && (
        <details>
          <summary>{t.more}</summary>
          {weekList(plan.weeks.slice(8))}
        </details>
      )}
    </section>
  );
}
