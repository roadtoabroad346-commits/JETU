import type { Locale } from '@/lib/i18n/messages';
import type { ApplicationStatus, ScholarshipApplicationStatus } from './engine';

type Copy = {
  nav: string;
  title: string;
  intro: string;
  portfolio: string;
  board: string;
  list: string;
  filter: string;
  allStatuses: string;
  sort: string;
  sortDeadline: string;
  sortUpdated: string;
  sortTitle: string;
  sortPriority: string;
  noFilteredApplications: string;
  create: string;
  chooseProgram: string;
  cycle: string;
  noPrograms: string;
  noApplications: string;
  open: string;
  retry: string;
  loading: string;
  error: string;
  researchingMetric: string;
  preparingMetric: string;
  submittedMetric: string;
  awaitingMetric: string;
  offersMetric: string;
  readiness: string;
  mandatory: string;
  optional: string;
  unknown: string;
  source: string;
  officialPortal: string;
  portalUnavailable: string;
  deadline: string;
  deadlineUnknown: string;
  userReported: string;
  externalNotice: string;
  workspace: string;
  back: string;
  notes: string;
  reference: string;
  priority: string;
  save: string;
  checklist: string;
  addItem: string;
  itemTitle: string;
  completed: string;
  markDone: string;
  reopen: string;
  verified: string;
  userCreated: string;
  roadmapLinked: string;
  stage: string;
  transition: string;
  reason: string;
  evidence: string;
  confirmSubmission: string;
  transitionHelp: string;
  scholarships: string;
  chooseScholarship: string;
  addScholarship: string;
  noScholarships: string;
  history: string;
  noHistory: string;
  saved: string;
  blocked: string;
  status: Record<ApplicationStatus, string>;
  scholarshipStatus: Record<ScholarshipApplicationStatus, string>;
};

const en: Copy = {
  nav: 'Applications',
  title: 'Application CRM',
  intro:
    'Track each program from research to enrollment. JETU never submits to an external portal for you.',
  portfolio: 'Portfolio',
  board: 'Board',
  list: 'List',
  filter: 'Filter by stage',
  allStatuses: 'All stages',
  sort: 'Sort applications',
  sortDeadline: 'Deadline first',
  sortUpdated: 'Recently updated',
  sortTitle: 'Program name',
  sortPriority: 'Priority first',
  noFilteredApplications: 'No applications match this filter.',
  create: 'Create workspace',
  chooseProgram: 'Published program',
  cycle: 'Enrollment year',
  noPrograms:
    'Save a reviewed published program before creating an application.',
  noApplications: 'No application workspaces yet.',
  open: 'Open workspace',
  retry: 'Retry',
  loading: 'Loading applications',
  error: 'Applications could not be loaded. Try again.',
  researchingMetric: 'Researching',
  preparingMetric: 'Preparing',
  submittedMetric: 'Submitted externally',
  awaitingMetric: 'Awaiting result',
  offersMetric: 'Offers / accepted',
  readiness: 'Required checklist readiness',
  mandatory: 'Mandatory',
  optional: 'Optional',
  unknown: 'Needs verification',
  source: 'Official source',
  officialPortal: 'Open official external portal',
  portalUnavailable: 'No verified official portal is stored.',
  deadline: 'Official deadline',
  deadlineUnknown: 'Official deadline unknown',
  userReported: 'User-reported',
  externalNotice:
    'This records what you report. It does not send an application, payment, essay or document to a university.',
  workspace: 'Application workspace',
  back: 'Back to applications',
  notes: 'Private notes',
  reference: 'Reference supplied by you',
  priority: 'Priority',
  save: 'Save changes',
  checklist: 'Readiness checklist',
  addItem: 'Add checklist item',
  itemTitle: 'Checklist item',
  completed: 'Completed',
  markDone: 'Mark complete',
  reopen: 'Reopen',
  verified: 'Source-verified',
  userCreated: 'Student-created',
  roadmapLinked: 'Linked to Roadmap',
  stage: 'Application stage',
  transition: 'Record stage change',
  reason: 'Reason or outcome reported by you',
  evidence: 'Evidence or portal receipt reference',
  confirmSubmission: 'I confirm I submitted this outside JETU',
  transitionHelp:
    'Mandatory items must be complete before review/submission stages.',
  scholarships: 'Scholarship applications',
  chooseScholarship: 'Published scholarship',
  addScholarship: 'Track scholarship separately',
  noScholarships: 'No linked scholarship applications.',
  history: 'Append-only history',
  noHistory: 'No events recorded.',
  saved: 'Saved',
  blocked: 'The database rejected this change. Review blockers and reload.',
  status: {
    researching: 'Researching',
    shortlisted: 'Shortlisted',
    preparing: 'Preparing',
    ready_for_review: 'Ready for review',
    ready_to_submit: 'Ready to submit externally',
    submitted_external_confirmed: 'Externally submitted — user-confirmed',
    under_review: 'Under review — user-reported',
    interview: 'Interview — user-reported',
    offer: 'Offer — user-reported',
    waitlist: 'Waitlist — user-reported',
    rejected: 'Rejected — user-reported',
    accepted: 'Accepted — user-reported',
    declined: 'Declined',
    enrollment: 'Enrolled — user-reported',
    withdrawn: 'Withdrawn',
  },
  scholarshipStatus: {
    researching: 'Researching',
    preparing: 'Preparing',
    ready_to_submit: 'Ready to submit externally',
    submitted_external_confirmed: 'Externally submitted — user-confirmed',
    under_review: 'Under review — user-reported',
    awarded: 'Awarded — user-reported',
    not_awarded: 'Not awarded — user-reported',
    withdrawn: 'Withdrawn',
  },
};

const ru: Copy = {
  ...en,
  nav: 'Заявки',
  title: 'CRM заявок',
  intro:
    'Ведите каждую программу от исследования до зачисления. JETU не отправляет заявку во внешний портал за вас.',
  portfolio: 'Портфель',
  board: 'Доска',
  list: 'Список',
  filter: 'Фильтр по этапу',
  allStatuses: 'Все этапы',
  sort: 'Сортировка заявок',
  sortDeadline: 'Сначала дедлайн',
  sortUpdated: 'Недавно обновлённые',
  sortTitle: 'Название программы',
  sortPriority: 'Сначала приоритетные',
  noFilteredApplications: 'По этому фильтру заявок нет.',
  create: 'Создать рабочую область',
  chooseProgram: 'Опубликованная программа',
  cycle: 'Год поступления',
  noPrograms: 'Сначала сохраните проверенную опубликованную программу.',
  noApplications: 'Рабочих областей заявок пока нет.',
  open: 'Открыть',
  retry: 'Повторить',
  loading: 'Загружаем заявки',
  error: 'Не удалось загрузить заявки. Повторите попытку.',
  researchingMetric: 'Исследование',
  preparingMetric: 'Подготовка',
  submittedMetric: 'Отправлены внешне',
  awaitingMetric: 'Ожидают решения',
  offersMetric: 'Офферы / приняты',
  readiness: 'Готовность обязательного списка',
  mandatory: 'Обязательно',
  optional: 'Необязательно',
  unknown: 'Нужно проверить',
  source: 'Официальный источник',
  officialPortal: 'Открыть официальный внешний портал',
  portalUnavailable: 'Проверенный официальный портал не сохранён.',
  deadline: 'Официальный дедлайн',
  deadlineUnknown: 'Официальный дедлайн неизвестен',
  userReported: 'Со слов пользователя',
  externalNotice:
    'Это запись вашего сообщения. Она не отправляет заявку, оплату, эссе или документ в университет.',
  workspace: 'Рабочая область заявки',
  back: 'Назад к заявкам',
  notes: 'Личные заметки',
  reference: 'Номер, указанный вами',
  priority: 'Приоритет',
  save: 'Сохранить',
  checklist: 'Чек-лист готовности',
  addItem: 'Добавить пункт',
  itemTitle: 'Пункт чек-листа',
  completed: 'Выполнено',
  markDone: 'Отметить выполненным',
  reopen: 'Вернуть в работу',
  verified: 'Подтверждено источником',
  userCreated: 'Создано учеником',
  roadmapLinked: 'Связано с Roadmap',
  stage: 'Этап заявки',
  transition: 'Записать смену этапа',
  reason: 'Причина или результат с ваших слов',
  evidence: 'Подтверждение или номер квитанции портала',
  confirmSubmission: 'Подтверждаю, что отправил(а) заявку вне JETU',
  transitionHelp: 'До review/submit обязательные пункты должны быть выполнены.',
  scholarships: 'Заявки на стипендии',
  chooseScholarship: 'Опубликованная стипендия',
  addScholarship: 'Отслеживать отдельно',
  noScholarships: 'Связанных заявок на стипендии нет.',
  history: 'Неизменяемая история',
  noHistory: 'Событий пока нет.',
  saved: 'Сохранено',
  blocked: 'База данных отклонила изменение. Проверьте блокеры и обновите.',
  status: {
    researching: 'Исследование',
    shortlisted: 'В шортлисте',
    preparing: 'Подготовка',
    ready_for_review: 'Готово к проверке',
    ready_to_submit: 'Готово к внешней отправке',
    submitted_external_confirmed:
      'Отправлено внешне — подтверждено пользователем',
    under_review: 'На рассмотрении — со слов пользователя',
    interview: 'Интервью — со слов пользователя',
    offer: 'Оффер — со слов пользователя',
    waitlist: 'Лист ожидания — со слов пользователя',
    rejected: 'Отказ — со слов пользователя',
    accepted: 'Оффер принят — со слов пользователя',
    declined: 'Оффер отклонён',
    enrollment: 'Зачисление — со слов пользователя',
    withdrawn: 'Заявка отозвана',
  },
  scholarshipStatus: {
    researching: 'Исследование',
    preparing: 'Подготовка',
    ready_to_submit: 'Готово к внешней отправке',
    submitted_external_confirmed:
      'Отправлено внешне — подтверждено пользователем',
    under_review: 'На рассмотрении — со слов пользователя',
    awarded: 'Присуждена — со слов пользователя',
    not_awarded: 'Не присуждена — со слов пользователя',
    withdrawn: 'Отозвана',
  },
};

const kk: Copy = {
  ...en,
  nav: 'Өтінімдер',
  title: 'Өтінімдер CRM-і',
  intro:
    'Әр бағдарламаны зерттеуден оқуға қабылдануға дейін жүргізіңіз. JETU сыртқы порталға сіздің атыңыздан өтінім жібермейді.',
  portfolio: 'Портфель',
  board: 'Тақта',
  list: 'Тізім',
  filter: 'Кезең бойынша сүзу',
  allStatuses: 'Барлық кезең',
  sort: 'Өтінімдерді сұрыптау',
  sortDeadline: 'Алдымен мерзімі жақын',
  sortUpdated: 'Жуырда жаңартылған',
  sortTitle: 'Бағдарлама атауы',
  sortPriority: 'Алдымен басымдығы жоғары',
  noFilteredApplications: 'Бұл сүзгіге сай өтінім жоқ.',
  create: 'Жұмыс кеңістігін құру',
  chooseProgram: 'Жарияланған бағдарлама',
  cycle: 'Оқуға түсу жылы',
  noPrograms: 'Алдымен тексерілген жарияланған бағдарламаны сақтаңыз.',
  noApplications: 'Өтінім жұмыс кеңістіктері әлі жоқ.',
  open: 'Ашу',
  retry: 'Қайталау',
  loading: 'Өтінімдер жүктелуде',
  error: 'Өтінімдерді жүктеу мүмкін болмады. Қайталап көріңіз.',
  researchingMetric: 'Зерттеу',
  preparingMetric: 'Дайындық',
  submittedMetric: 'Сыртқы түрде жіберілді',
  awaitingMetric: 'Шешім күтілуде',
  offersMetric: 'Офферлер / қабылданды',
  readiness: 'Міндетті тізім дайындығы',
  mandatory: 'Міндетті',
  optional: 'Қосымша',
  unknown: 'Тексеру қажет',
  source: 'Ресми дереккөз',
  officialPortal: 'Ресми сыртқы порталды ашу',
  portalUnavailable: 'Тексерілген ресми портал сақталмаған.',
  deadline: 'Ресми мерзім',
  deadlineUnknown: 'Ресми мерзім белгісіз',
  userReported: 'Пайдаланушы хабарлады',
  externalNotice:
    'Бұл сіз хабарлаған деректі ғана жазады. Университетке өтінім, төлем, эссе немесе құжат жібермейді.',
  workspace: 'Өтінім жұмыс кеңістігі',
  back: 'Өтінімдерге оралу',
  notes: 'Жеке жазбалар',
  reference: 'Сіз енгізген нөмір',
  priority: 'Басымдық',
  save: 'Сақтау',
  checklist: 'Дайындық тізімі',
  addItem: 'Тармақ қосу',
  itemTitle: 'Тізім тармағы',
  completed: 'Орындалды',
  markDone: 'Орындалды деп белгілеу',
  reopen: 'Қайта ашу',
  verified: 'Дереккөзбен расталған',
  userCreated: 'Оқушы жасаған',
  roadmapLinked: 'Roadmap-пен байланысқан',
  stage: 'Өтінім кезеңі',
  transition: 'Кезең өзгерісін жазу',
  reason: 'Сіз хабарлаған себеп немесе нәтиже',
  evidence: 'Растау немесе портал түбіртегінің нөмірі',
  confirmSubmission: 'Өтінімді JETU-дан тыс жібергенімді растаймын',
  transitionHelp: 'Review/submit алдында міндетті тармақтар орындалуы керек.',
  scholarships: 'Стипендия өтінімдері',
  chooseScholarship: 'Жарияланған стипендия',
  addScholarship: 'Бөлек бақылау',
  noScholarships: 'Байланысқан стипендия өтінімдері жоқ.',
  history: 'Өзгермейтін тарих',
  noHistory: 'Оқиғалар әлі жоқ.',
  saved: 'Сақталды',
  blocked: 'Дерекқор өзгерісті қабылдамады. Кедергілерді тексеріп, жаңартыңыз.',
  status: {
    researching: 'Зерттеу',
    shortlisted: 'Қысқа тізімде',
    preparing: 'Дайындық',
    ready_for_review: 'Тексеруге дайын',
    ready_to_submit: 'Сыртқы жіберуге дайын',
    submitted_external_confirmed:
      'Сыртқы түрде жіберілді — пайдаланушы растады',
    under_review: 'Қаралуда — пайдаланушы хабарлады',
    interview: 'Сұхбат — пайдаланушы хабарлады',
    offer: 'Оффер — пайдаланушы хабарлады',
    waitlist: 'Күту тізімі — пайдаланушы хабарлады',
    rejected: 'Қабылданбады — пайдаланушы хабарлады',
    accepted: 'Оффер қабылданды — пайдаланушы хабарлады',
    declined: 'Оффер қабылданбады',
    enrollment: 'Оқуға қабылданды — пайдаланушы хабарлады',
    withdrawn: 'Өтінім қайтарылды',
  },
  scholarshipStatus: {
    researching: 'Зерттеу',
    preparing: 'Дайындық',
    ready_to_submit: 'Сыртқы жіберуге дайын',
    submitted_external_confirmed:
      'Сыртқы түрде жіберілді — пайдаланушы растады',
    under_review: 'Қаралуда — пайдаланушы хабарлады',
    awarded: 'Тағайындалды — пайдаланушы хабарлады',
    not_awarded: 'Тағайындалмады — пайдаланушы хабарлады',
    withdrawn: 'Қайтарылды',
  },
};

export const applicationsCopy: Record<Locale, Copy> = { en, ru, kk };
