import type { Locale } from '@/lib/i18n/messages';
import type { RoadmapTemplates } from './engine';

type RoadmapCopy = {
  title: string;
  nav: string;
  intro: string;
  generate: string;
  regenerate: string;
  generating: string;
  retry: string;
  unavailable: string;
  noRoadmap: string;
  noTargets: string;
  savedTargets: string;
  cycleYear: string;
  timezone: string;
  availability: string;
  minutesPerWeek: string;
  progress: string;
  completed: string;
  upcoming: string;
  overdue: string;
  nextAction: string;
  nextReason: string;
  views: {
    overview: string;
    kanban: string;
    timeline: string;
    calendar: string;
    checklist: string;
  };
  columns: {
    todo: string;
    in_progress: string;
    blocked: string;
    completed: string;
  };
  addTask: string;
  editTask: string;
  save: string;
  cancel: string;
  delete: string;
  reopen: string;
  start: string;
  complete: string;
  details: string;
  notes: string;
  priority: string;
  dueDate: string;
  targetDate: string;
  officialDeadline: string;
  internalDate: string;
  unknownDate: string;
  dateOnly: string;
  rolling: string;
  source: string;
  dependencies: string;
  blockedBy: string;
  optional: string;
  mandatory: string;
  manual: string;
  generated: string;
  search: string;
  all: string;
  status: string;
  taskTitle: string;
  taskDescription: string;
  why: string;
  estimatedTime: string;
  previousMonth: string;
  nextMonth: string;
  noTasks: string;
  updateConflict: string;
  actionError: string;
  regenerated: string;
  saved: string;
  removed: string;
  priorityLabels: Record<'low' | 'medium' | 'high' | 'critical', string>;
};

export const roadmapCopy: Record<Locale, RoadmapCopy> = {
  en: {
    title: 'Personal roadmap',
    nav: 'Roadmap',
    intro: 'A source-aware plan built from your profile and selected targets.',
    generate: 'Generate roadmap',
    regenerate: 'Regenerate safely',
    generating: 'Updating roadmap…',
    retry: 'Try again',
    unavailable:
      'The roadmap could not be loaded. Your saved work was not changed.',
    noRoadmap: 'Generate your first evidence-based roadmap.',
    noTargets:
      'No saved program or scholarship targets are available. The roadmap will help you complete your profile and choose one.',
    savedTargets: 'Roadmap targets',
    cycleYear: 'Enrollment year',
    timezone: 'Planning timezone',
    availability: 'Weekly availability',
    minutesPerWeek: 'minutes per week',
    progress: 'Overall progress',
    completed: 'completed',
    upcoming: 'Upcoming',
    overdue: 'Needs recovery',
    nextAction: 'What should I do next?',
    nextReason: 'Recommended from deadline, priority, and dependency evidence.',
    views: {
      overview: 'Overview',
      kanban: 'Kanban',
      timeline: 'Timeline',
      calendar: 'Calendar',
      checklist: 'Checklist',
    },
    columns: {
      todo: 'To do',
      in_progress: 'In progress',
      blocked: 'Blocked',
      completed: 'Completed',
    },
    addTask: 'Add manual task',
    editTask: 'Edit task',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    reopen: 'Reopen',
    start: 'Start',
    complete: 'Complete',
    details: 'Task details',
    notes: 'Notes',
    priority: 'Priority',
    dueDate: 'Due date',
    targetDate: 'My target date',
    officialDeadline: 'Official deadline',
    internalDate: 'Recommended internal date',
    unknownDate: 'Unknown — verification required',
    dateOnly: 'Date only; no cutoff time published',
    rolling: 'Rolling deadline',
    source: 'Official source',
    dependencies: 'Dependencies',
    blockedBy: 'Blocked by',
    optional: 'Optional',
    mandatory: 'Mandatory',
    manual: 'Manual',
    generated: 'Generated',
    search: 'Search tasks',
    all: 'All',
    status: 'Status',
    taskTitle: 'Task title',
    taskDescription: 'Description',
    why: 'Why this matters',
    estimatedTime: 'Estimated time',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    noTasks: 'No tasks match these filters.',
    updateConflict: 'This task changed elsewhere. Reload and try again.',
    actionError: 'The change was not saved. Try again.',
    regenerated: 'Roadmap updated without replacing manual work.',
    saved: 'Task saved.',
    removed: 'Task removed.',
    priorityLabels: {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      critical: 'Urgent',
    },
  },
  ru: {
    title: 'Персональный план',
    nav: 'План',
    intro:
      'План на основе профиля, выбранных целей и подтверждённых источников.',
    generate: 'Создать план',
    regenerate: 'Безопасно обновить',
    generating: 'Обновляем план…',
    retry: 'Повторить',
    unavailable: 'Не удалось загрузить план. Сохранённые данные не изменены.',
    noRoadmap: 'Создайте первый план на основе подтверждённых данных.',
    noTargets:
      'Нет сохранённых программ или стипендий. План поможет заполнить профиль и выбрать цель.',
    savedTargets: 'Цели плана',
    cycleYear: 'Год поступления',
    timezone: 'Часовой пояс плана',
    availability: 'Время в неделю',
    minutesPerWeek: 'минут в неделю',
    progress: 'Общий прогресс',
    completed: 'выполнено',
    upcoming: 'Ближайшие',
    overdue: 'Нужен новый план',
    nextAction: 'Что делать дальше?',
    nextReason: 'Рекомендация учитывает сроки, приоритет и зависимости.',
    views: {
      overview: 'Обзор',
      kanban: 'Канбан',
      timeline: 'Линия времени',
      calendar: 'Календарь',
      checklist: 'Список',
    },
    columns: {
      todo: 'Нужно сделать',
      in_progress: 'В работе',
      blocked: 'Заблокировано',
      completed: 'Готово',
    },
    addTask: 'Добавить свою задачу',
    editTask: 'Изменить задачу',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    reopen: 'Открыть снова',
    start: 'Начать',
    complete: 'Завершить',
    details: 'Детали задачи',
    notes: 'Заметки',
    priority: 'Приоритет',
    dueDate: 'Срок',
    targetDate: 'Моя дата',
    officialDeadline: 'Официальный дедлайн',
    internalDate: 'Рекомендуемая внутренняя дата',
    unknownDate: 'Неизвестно — нужно проверить',
    dateOnly: 'Только дата; время окончания не опубликовано',
    rolling: 'Приём по мере поступления',
    source: 'Официальный источник',
    dependencies: 'Зависимости',
    blockedBy: 'Зависит от',
    optional: 'Необязательно',
    mandatory: 'Обязательно',
    manual: 'Своя задача',
    generated: 'Создано планом',
    search: 'Поиск задач',
    all: 'Все',
    status: 'Статус',
    taskTitle: 'Название задачи',
    taskDescription: 'Описание',
    why: 'Почему это важно',
    estimatedTime: 'Оценка времени',
    previousMonth: 'Предыдущий месяц',
    nextMonth: 'Следующий месяц',
    noTasks: 'По этим фильтрам задач нет.',
    updateConflict: 'Задача изменилась в другой сессии. Обновите страницу.',
    actionError: 'Изменение не сохранено. Повторите.',
    regenerated: 'План обновлён, личные задачи сохранены.',
    saved: 'Задача сохранена.',
    removed: 'Задача удалена.',
    priorityLabels: {
      low: 'Низкий',
      medium: 'Средний',
      high: 'Высокий',
      critical: 'Срочно',
    },
  },
  kk: {
    title: 'Жеке жол картасы',
    nav: 'Жол картасы',
    intro:
      'Профиль, таңдалған мақсаттар және расталған дереккөздер негізіндегі жоспар.',
    generate: 'Жол картасын құру',
    regenerate: 'Қауіпсіз жаңарту',
    generating: 'Жол картасы жаңартылуда…',
    retry: 'Қайталау',
    unavailable: 'Жол картасы жүктелмеді. Сақталған жұмыс өзгерген жоқ.',
    noRoadmap: 'Расталған деректерге негізделген алғашқы жол картасын құрыңыз.',
    noTargets:
      'Сақталған бағдарлама немесе стипендия жоқ. Жол картасы профильді толықтырып, мақсат таңдауға көмектеседі.',
    savedTargets: 'Жол картасының мақсаттары',
    cycleYear: 'Оқуға түсу жылы',
    timezone: 'Жоспарлау уақыт белдеуі',
    availability: 'Апталық уақыт',
    minutesPerWeek: 'аптасына минут',
    progress: 'Жалпы ілгерілеу',
    completed: 'аяқталды',
    upcoming: 'Алдағы',
    overdue: 'Қалпына келтіру керек',
    nextAction: 'Келесі не істеу керек?',
    nextReason: 'Мерзім, басымдық және тәуелділік деректеріне негізделген.',
    views: {
      overview: 'Шолу',
      kanban: 'Канбан',
      timeline: 'Уақыт сызығы',
      calendar: 'Күнтізбе',
      checklist: 'Тізім',
    },
    columns: {
      todo: 'Орындалатын',
      in_progress: 'Орындалуда',
      blocked: 'Бұғатталған',
      completed: 'Аяқталған',
    },
    addTask: 'Жеке тапсырма қосу',
    editTask: 'Тапсырманы өңдеу',
    save: 'Сақтау',
    cancel: 'Болдырмау',
    delete: 'Жою',
    reopen: 'Қайта ашу',
    start: 'Бастау',
    complete: 'Аяқтау',
    details: 'Тапсырма мәліметтері',
    notes: 'Жазбалар',
    priority: 'Басымдық',
    dueDate: 'Мерзім',
    targetDate: 'Менің мақсатты күнім',
    officialDeadline: 'Ресми мерзім',
    internalDate: 'Ұсынылған ішкі күн',
    unknownDate: 'Белгісіз — тексеру қажет',
    dateOnly: 'Тек күн; аяқталу уақыты жарияланбаған',
    rolling: 'Құжаттар кезеңмен қабылданады',
    source: 'Ресми дереккөз',
    dependencies: 'Тәуелділіктер',
    blockedBy: 'Мыналарға тәуелді',
    optional: 'Міндетті емес',
    mandatory: 'Міндетті',
    manual: 'Жеке',
    generated: 'Жоспар құрған',
    search: 'Тапсырмаларды іздеу',
    all: 'Барлығы',
    status: 'Күйі',
    taskTitle: 'Тапсырма атауы',
    taskDescription: 'Сипаттама',
    why: 'Неліктен маңызды',
    estimatedTime: 'Болжалды уақыт',
    previousMonth: 'Алдыңғы ай',
    nextMonth: 'Келесі ай',
    noTasks: 'Бұл сүзгілерге сәйкес тапсырма жоқ.',
    updateConflict: 'Тапсырма басқа сессияда өзгерді. Бетті жаңартыңыз.',
    actionError: 'Өзгеріс сақталмады. Қайта көріңіз.',
    regenerated: 'Жол картасы жаңартылды, жеке тапсырмалар сақталды.',
    saved: 'Тапсырма сақталды.',
    removed: 'Тапсырма жойылды.',
    priorityLabels: {
      low: 'Төмен',
      medium: 'Орташа',
      high: 'Жоғары',
      critical: 'Шұғыл',
    },
  },
};

const baseTemplates: Record<Locale, RoadmapTemplates> = {
  en: {
    profileMilestone: 'Build a complete planning profile',
    profileTask: (f) => `Complete profile fields: ${f}`,
    profileDescription:
      'Complete profile facts make gap planning specific and explainable.',
    selectTarget: 'Choose at least one saved program or scholarship',
    selectTargetDescription:
      'Save a verified target, then generate its specific admissions path.',
    preparationMilestone: (t) => `Prepare for ${t}`,
    submissionMilestone: (t) => `Application for ${t}`,
    postDecisionMilestone: (t) => `After the decision: ${t}`,
    research: (t) => `Review the official ${t} page`,
    researchWhy: 'Official evidence anchors the rest of the plan.',
    confirmRequirements: 'Confirm current admissions requirements',
    confirmRequirementsWhy: 'Requirements may change between cycles.',
    verifyDeadline: 'Verify the official application deadline',
    verifyDeadlineWhy:
      'No current verified cutoff is available, so no date is invented.',
    verifyRequirement: (r) => `Verify requirement: ${r}`,
    closeGap: (r) => `Plan how to address: ${r}`,
    prepareTest: (t) => `Prepare and verify ${t}`,
    requirementWhy:
      'This follows a target-specific requirement or unresolved evidence gap.',
    verifyDocuments: 'Confirm the required document list',
    prepareDocument: (d) => `Prepare ${d}`,
    documentsWhy: 'Use only documents confirmed by the official workflow.',
    prepareApplication: 'Prepare the application materials',
    reviewApplication: 'Review the application against confirmed requirements',
    submitApplication: 'Submit through the official application channel',
    separateScholarship: 'Complete the separate scholarship application',
    trackDecision: 'Track the official admissions decision',
    interviewCheck: 'Check whether an interview is requested',
    visaCheck: 'Verify visa steps after an offer',
    enrollmentCheck: 'Verify enrollment instructions after an offer',
    applicationWhy: 'This is part of the selected target’s application path.',
    postDecisionWhy:
      'This conditional step applies only after an official decision or offer.',
  },
  ru: {
    profileMilestone: 'Заполнить профиль для планирования',
    profileTask: (f) => `Заполнить поля профиля: ${f}`,
    profileDescription: 'Полный профиль делает план конкретным и объяснимым.',
    selectTarget: 'Выбрать сохранённую программу или стипендию',
    selectTargetDescription:
      'Сохраните проверенную цель и создайте её путь поступления.',
    preparationMilestone: (t) => `Подготовка: ${t}`,
    submissionMilestone: (t) => `Подача: ${t}`,
    postDecisionMilestone: (t) => `После решения: ${t}`,
    research: (t) => `Изучить официальную страницу: ${t}`,
    researchWhy: 'Официальный источник задаёт основу плана.',
    confirmRequirements: 'Подтвердить актуальные требования',
    confirmRequirementsWhy: 'Требования могут меняться между циклами.',
    verifyDeadline: 'Проверить официальный дедлайн',
    verifyDeadlineWhy:
      'Подтверждённой даты нет, поэтому план её не выдумывает.',
    verifyRequirement: (r) => `Проверить требование: ${r}`,
    closeGap: (r) => `Составить план по требованию: ${r}`,
    prepareTest: (t) => `Подготовиться и подтвердить ${t}`,
    requirementWhy: 'Действие следует из требования цели или пробела в данных.',
    verifyDocuments: 'Подтвердить список документов',
    prepareDocument: (d) => `Подготовить: ${d}`,
    documentsWhy:
      'Используйте только документы, подтверждённые официальным процессом.',
    prepareApplication: 'Подготовить материалы заявки',
    reviewApplication: 'Проверить заявку по подтверждённым требованиям',
    submitApplication: 'Подать через официальный канал',
    separateScholarship: 'Заполнить отдельную заявку на стипендию',
    trackDecision: 'Отслеживать официальное решение',
    interviewCheck: 'Проверить, назначено ли интервью',
    visaCheck: 'Проверить визовые шаги после оффера',
    enrollmentCheck: 'Проверить инструкции по зачислению после оффера',
    applicationWhy: 'Это часть пути подачи к выбранной цели.',
    postDecisionWhy:
      'Шаг актуален только после официального решения или оффера.',
  },
  kk: {
    profileMilestone: 'Жоспарлау профилін толықтыру',
    profileTask: (f) => `Профиль өрістерін толтыру: ${f}`,
    profileDescription: 'Толық профиль жоспарды нақты әрі түсінікті етеді.',
    selectTarget: 'Сақталған бағдарлама немесе стипендия таңдау',
    selectTargetDescription:
      'Расталған мақсатты сақтап, оның түсу жолын құрыңыз.',
    preparationMilestone: (t) => `Дайындық: ${t}`,
    submissionMilestone: (t) => `Өтінім: ${t}`,
    postDecisionMilestone: (t) => `Шешімнен кейін: ${t}`,
    research: (t) => `Ресми бетті қарау: ${t}`,
    researchWhy: 'Ресми дереккөз жоспардың негізін құрайды.',
    confirmRequirements: 'Қазіргі талаптарды растау',
    confirmRequirementsWhy:
      'Талаптар қабылдау кезеңдері арасында өзгеруі мүмкін.',
    verifyDeadline: 'Ресми мерзімді тексеру',
    verifyDeadlineWhy:
      'Расталған мерзім жоқ, сондықтан жоспар күнді ойдан шығармайды.',
    verifyRequirement: (r) => `Талапты тексеру: ${r}`,
    closeGap: (r) => `Талапқа дайындық жоспары: ${r}`,
    prepareTest: (t) => `${t} дайындау және растау`,
    requirementWhy:
      'Бұл әрекет мақсат талабы немесе дерек олқылығы негізінде жасалды.',
    verifyDocuments: 'Қажетті құжаттар тізімін растау',
    prepareDocument: (d) => `${d} дайындау`,
    documentsWhy: 'Тек ресми үдерісте расталған құжаттарды пайдаланыңыз.',
    prepareApplication: 'Өтінім материалдарын дайындау',
    reviewApplication: 'Өтінімді расталған талаптармен тексеру',
    submitApplication: 'Ресми арна арқылы жіберу',
    separateScholarship: 'Стипендияға бөлек өтінімді толтыру',
    trackDecision: 'Ресми шешімді бақылау',
    interviewCheck: 'Сұхбат тағайындалғанын тексеру',
    visaCheck: 'Ұсыныстан кейінгі виза қадамдарын тексеру',
    enrollmentCheck: 'Ұсыныстан кейінгі тіркелу нұсқауларын тексеру',
    applicationWhy: 'Бұл таңдалған мақсатқа өтінім жолының бөлігі.',
    postDecisionWhy:
      'Бұл шартты қадам ресми шешімнен немесе ұсыныстан кейін ғана қолданылады.',
  },
};

export const roadmapTemplates = baseTemplates;
