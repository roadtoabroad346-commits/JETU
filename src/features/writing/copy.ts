import type { Locale } from '@/lib/i18n/messages';
const en = {
  title: 'Writing Studio',
  subtitle: 'Your experience. Your voice. A clearer next draft.',
  private: 'Private by default. Your writing stays yours.',
  newProject: 'New project',
  projectTitle: 'Project title',
  kind: 'Writing goal',
  create: 'Open a blank page',
  empty: 'Start with something only you can tell.',
  emptyBody:
    'Choose a goal and give your project a name. No AI consent is needed to write.',
  projects: 'Your projects',
  archived: 'Archived',
  showArchive: 'Show archived',
  archive: 'Archive',
  reopen: 'Reopen',
  duplicate: 'Duplicate',
  continue: 'Continue writing',
  editor: 'Draft',
  context: 'Prompt & context',
  feedback: 'Review',
  history: 'Versions',
  save: 'Save checkpoint',
  saved: 'Saved on server',
  saving: 'Saving…',
  unsaved: 'Unsaved changes',
  offline: 'Offline — keep this tab open or export your text.',
  error: 'Save failed. Your text remains here. Retry or export before leaving.',
  conflict:
    'Another session changed this project. Your text is preserved. Export it, then load the server copy or save as a separate project.',
  retry: 'Retry save',
  reload: 'Load server copy',
  recover: 'Save a separate copy',
  leave: 'Unsaved text will be lost. Export or save before switching projects.',
  loading: 'Loading your private workspace…',
  loadError: 'Workspace unavailable. Retry loading.',
  retryLoad: 'Retry loading',
  back: 'All projects',
  prompt: 'Your prompt / instructions',
  personalLimit: 'Personal word target (optional)',
  unknown:
    'Official requirements and AI rules are unknown unless a current verified source is selected.',
  source: 'Verified source',
  noSource: 'No verified source selected',
  application: 'Application',
  general: 'General writing',
  words: 'Words',
  characters: 'Characters (Unicode code points)',
  withoutSpaces: 'Characters excluding whitespace',
  countHelp:
    'Words use Unicode word segmentation; emoji are not words. Combining marks count as separate code points.',
  overLimit: 'The text exceeds the selected limit.',
  distraction: 'Focus mode',
  exitFocus: 'Exit focus mode',
  review: 'Run local checks',
  deterministic:
    'Deterministic checks and reflection questions — not an AI review or admissions grade.',
  aiUnavailable:
    'AI review is unavailable: a server provider has not been configured and verified. Your text is not sent to an AI service.',
  integrity:
    'Use only your own experiences and truthful achievements. Follow the institution’s AI rules. These checks cannot prove originality.',
  accept: 'Accept proposed edit',
  dismiss: 'Dismiss',
  resolved: 'Resolved',
  stale: 'Stale review — text changed. Run checks again.',
  locate: 'Show passage',
  undo: 'Undo last accepted edit',
  noReview:
    'Run checks to see passage-specific guidance. Check each rubric item yourself.',
  checklist: 'Student self-review',
  ready: 'Mark writing ready',
  notReady:
    'Complete all five self-review checks, address open comments, and meet limits first.',
  readyNotice:
    'Writing marked ready by you. This does not submit or change an admissions decision.',
  compare: 'Compare with current draft',
  restore: 'Restore as new checkpoint',
  before: 'Earlier version',
  after: 'Current draft',
  noVersions: 'No checkpoints yet. The first successful save creates one.',
  restored: 'Restored into a new checkpoint.',
  export: 'Export TXT',
  print: 'Print / save as PDF',
  exportHelp:
    'TXT preserves Unicode. PDF uses your browser’s print dialog; DOCX export is unavailable.',
  cv: 'CV & activities',
  addSection: 'Add section',
  section: 'Section',
  heading: 'Role / qualification / project',
  details: 'Your contributions and evidence',
  start: 'Start (YYYY-MM)',
  end: 'End (YYYY-MM)',
  moveUp: 'Move up',
  moveDown: 'Move down',
  remove: 'Remove section',
  preview: 'Document preview',
  dateError: 'Use YYYY-MM; the end must not precede the start.',
  interview: 'Interview practice',
  scenario: 'Practice focus',
  startPractice: 'Start practice',
  pause: 'Pause',
  resume: 'Resume',
  finish: 'End practice',
  next: 'Next question',
  answer: 'Your answer',
  practicePrivacy:
    'Practice is kept in this tab only. Enable history explicitly to save answers as a private project.',
  remember: 'Save private practice history',
  generalPractice: 'General practice; not an official university interview.',
  paused: 'Practice paused',
  finished: 'Practice ended',
  emailTemplate: 'Insert an editable email scaffold',
  emailScaffold:
    'Subject: Question about [program / requirement]\n\nDear Admissions Team,\n\nI am considering [program and intake]. I have checked [official source] and would like to clarify [one specific question].\n\nThank you for your time.\n[Your name]',
  translation:
    'Templates and questions follow the interface language. Your own text is never translated.',
  policy: 'Institution AI policy',
  cycle: 'Application cycle',
  verifiedAt: 'Verified',
  noApplications: 'No active applications available; use general writing.',
  removeSource: 'Use my own prompt',
  discard: 'Discard local edits',
  progress: 'Self-review items completed',
  sectionPrivacy:
    'Include only contact details you intend to export. No profile data is added automatically.',
  statusReady: 'Ready (self-reviewed)',
  statusDraft: 'In progress',
};
type Copy = { [K in keyof typeof en]: string };
const ru: Copy = {
  title: 'Студия текстов',
  subtitle: 'Ваш опыт. Ваш голос. Следующая версия — яснее.',
  private: 'По умолчанию приватно. Автор текста — вы.',
  newProject: 'Новый проект',
  projectTitle: 'Название проекта',
  kind: 'Цель текста',
  create: 'Открыть чистый лист',
  empty: 'Начните с истории, которую можете рассказать только вы.',
  emptyBody:
    'Выберите цель и название. Согласие на AI для письма не требуется.',
  projects: 'Ваши проекты',
  archived: 'Архив',
  showArchive: 'Показать архив',
  archive: 'В архив',
  reopen: 'Вернуть',
  duplicate: 'Создать копию',
  continue: 'Продолжить текст',
  editor: 'Черновик',
  context: 'Задание и контекст',
  feedback: 'Разбор',
  history: 'Версии',
  save: 'Сохранить версию',
  saved: 'Сохранено на сервере',
  saving: 'Сохранение…',
  unsaved: 'Есть несохранённые изменения',
  offline: 'Нет сети — держите вкладку открытой или экспортируйте текст.',
  error:
    'Не удалось сохранить. Текст остался здесь. Повторите или экспортируйте перед выходом.',
  conflict:
    'Другая сессия изменила проект. Ваш текст сохранён в редакторе. Экспортируйте его, затем загрузите серверную версию или создайте отдельную копию.',
  retry: 'Повторить сохранение',
  reload: 'Загрузить с сервера',
  recover: 'Сохранить отдельную копию',
  leave:
    'Несохранённый текст будет потерян. Сохраните или экспортируйте перед переходом.',
  loading: 'Загружаем приватные проекты…',
  loadError: 'Студия недоступна. Повторите загрузку.',
  retryLoad: 'Повторить загрузку',
  back: 'Все проекты',
  prompt: 'Ваше задание / инструкции',
  personalLimit: 'Личная цель по словам (необязательно)',
  unknown:
    'Официальные требования и правила AI неизвестны без актуального проверенного источника.',
  source: 'Проверенный источник',
  noSource: 'Проверенный источник не выбран',
  application: 'Заявка',
  general: 'Общий текст',
  words: 'Слова',
  characters: 'Символы (кодовые точки Unicode)',
  withoutSpaces: 'Символы без пробельных знаков',
  countHelp:
    'Слова определяются сегментацией Unicode; эмодзи не считаются словами. Комбинируемые знаки — отдельные кодовые точки.',
  overLimit: 'Текст превышает выбранный лимит.',
  distraction: 'Режим фокуса',
  exitFocus: 'Выйти из фокуса',
  review: 'Запустить локальную проверку',
  deterministic:
    'Детерминированные проверки и вопросы для размышления — не AI-разбор и не оценка поступления.',
  aiUnavailable:
    'AI-разбор недоступен: серверный провайдер не настроен и не проверен. Текст не отправляется в AI.',
  integrity:
    'Используйте свой опыт и реальные достижения. Соблюдайте правила AI учебного заведения. Проверки не доказывают оригинальность.',
  accept: 'Принять предложенную правку',
  dismiss: 'Отклонить',
  resolved: 'Решено',
  stale: 'Разбор устарел: текст изменился. Запустите проверку снова.',
  locate: 'Показать отрывок',
  undo: 'Отменить последнюю правку',
  noReview:
    'Запустите проверку для рекомендаций по отрывкам. Каждый критерий отметьте самостоятельно.',
  checklist: 'Самопроверка автора',
  ready: 'Отметить текст готовым',
  notReady:
    'Пройдите пять критериев, разберите открытые комментарии и соблюдите лимиты.',
  readyNotice:
    'Вы отметили текст готовым. Это не отправляет заявку и не меняет решение о поступлении.',
  compare: 'Сравнить с текущим текстом',
  restore: 'Восстановить как новую версию',
  before: 'Ранняя версия',
  after: 'Текущий текст',
  noVersions: 'Версий пока нет. Первая появится после успешного сохранения.',
  restored: 'Восстановлено в новую версию.',
  export: 'Экспорт TXT',
  print: 'Печать / сохранить PDF',
  exportHelp:
    'TXT сохраняет Unicode. PDF — через диалог печати браузера; DOCX недоступен.',
  cv: 'CV и активности',
  addSection: 'Добавить раздел',
  section: 'Раздел',
  heading: 'Роль / квалификация / проект',
  details: 'Ваш вклад и подтверждения',
  start: 'Начало (ГГГГ-ММ)',
  end: 'Окончание (ГГГГ-ММ)',
  moveUp: 'Выше',
  moveDown: 'Ниже',
  remove: 'Удалить раздел',
  preview: 'Предпросмотр документа',
  dateError: 'Укажите ГГГГ-ММ; окончание не раньше начала.',
  interview: 'Практика интервью',
  scenario: 'Тема практики',
  startPractice: 'Начать практику',
  pause: 'Пауза',
  resume: 'Продолжить',
  finish: 'Завершить практику',
  next: 'Следующий вопрос',
  answer: 'Ваш ответ',
  practicePrivacy:
    'Ответы остаются в этой вкладке. Включите историю, чтобы сохранять их в приватном проекте.',
  remember: 'Сохранять приватную историю практики',
  generalPractice: 'Общая практика, не официальное интервью университета.',
  paused: 'Практика на паузе',
  finished: 'Практика завершена',
  emailTemplate: 'Вставить редактируемый шаблон письма',
  emailScaffold:
    'Тема: Вопрос о [программе / требовании]\n\nУважаемая приёмная комиссия,\n\nЯ рассматриваю [программу и год поступления]. Я изучил(а) [официальный источник] и хочу уточнить [один конкретный вопрос].\n\nБлагодарю за ваше время.\n[Ваше имя]',
  translation:
    'Шаблоны и вопросы используют язык интерфейса. Ваш текст не переводится.',
  policy: 'Правила AI учебного заведения',
  cycle: 'Цикл поступления',
  verifiedAt: 'Проверено',
  noApplications: 'Активных заявок нет; доступен общий текст.',
  removeSource: 'Использовать своё задание',
  discard: 'Отбросить локальные изменения',
  progress: 'Пройдено критериев самопроверки',
  sectionPrivacy:
    'Добавляйте только контакты, которые хотите экспортировать. Данные профиля не подставляются.',
  statusReady: 'Готово (самопроверка)',
  statusDraft: 'В работе',
};
const kk: Copy = {
  title: 'Мәтін студиясы',
  subtitle: 'Сіздің тәжірибеңіз. Сіздің үніңіз. Айқынырақ келесі нұсқа.',
  private: 'Әдепкіде құпия. Мәтіннің авторы — сіз.',
  newProject: 'Жаңа жоба',
  projectTitle: 'Жоба атауы',
  kind: 'Мәтін мақсаты',
  create: 'Таза парақ ашу',
  empty: 'Тек өзіңіз айта алатын оқиғадан бастаңыз.',
  emptyBody: 'Мақсат пен атау таңдаңыз. Жазу үшін AI келісімі қажет емес.',
  projects: 'Жобаларыңыз',
  archived: 'Мұрағат',
  showArchive: 'Мұрағатты көрсету',
  archive: 'Мұрағаттау',
  reopen: 'Қайтару',
  duplicate: 'Көшірме жасау',
  continue: 'Жазуды жалғастыру',
  editor: 'Қолжазба',
  context: 'Тапсырма және контекст',
  feedback: 'Талдау',
  history: 'Нұсқалар',
  save: 'Нұсқаны сақтау',
  saved: 'Серверде сақталды',
  saving: 'Сақталуда…',
  unsaved: 'Сақталмаған өзгерістер бар',
  offline: 'Желі жоқ — қойындыны ашық ұстаңыз немесе мәтінді экспорттаңыз.',
  error:
    'Сақтау мүмкін болмады. Мәтін осында қалды. Шығар алдында қайталаңыз не экспорттаңыз.',
  conflict:
    'Басқа сессия жобаны өзгертті. Мәтініңіз редакторда қалды. Экспорттап, сервер нұсқасын жүктеңіз немесе бөлек көшірме жасаңыз.',
  retry: 'Сақтауды қайталау',
  reload: 'Серверден жүктеу',
  recover: 'Бөлек көшірме сақтау',
  leave:
    'Сақталмаған мәтін жоғалады. Ауысар алдында сақтаңыз немесе экспорттаңыз.',
  loading: 'Құпия жобалар жүктелуде…',
  loadError: 'Студия қолжетімсіз. Жүктеуді қайталаңыз.',
  retryLoad: 'Қайта жүктеу',
  back: 'Барлық жобалар',
  prompt: 'Сіздің тапсырмаңыз / нұсқаулар',
  personalLimit: 'Жеке сөз мақсаты (міндетті емес)',
  unknown:
    'Тексерілген өзекті дереккөзсіз ресми талаптар мен AI ережелері белгісіз.',
  source: 'Тексерілген дереккөз',
  noSource: 'Тексерілген дереккөз таңдалмады',
  application: 'Өтінім',
  general: 'Жалпы мәтін',
  words: 'Сөздер',
  characters: 'Таңбалар (Unicode код нүктелері)',
  withoutSpaces: 'Бос орынсыз таңбалар',
  countHelp:
    'Сөздер Unicode арқылы бөлінеді; эмодзи сөз емес. Құрама белгілер бөлек код нүктелері болып саналады.',
  overLimit: 'Мәтін таңдалған шектен асады.',
  distraction: 'Зейін режимі',
  exitFocus: 'Зейін режимінен шығу',
  review: 'Жергілікті тексеру',
  deterministic:
    'Детерминдік тексеру мен ойлану сұрақтары — AI талдауы не қабылдау бағасы емес.',
  aiUnavailable:
    'AI талдауы қолжетімсіз: сервер провайдері бапталмаған және тексерілмеген. Мәтін AI қызметіне жіберілмейді.',
  integrity:
    'Өз тәжірибеңіз бен шынайы жетістіктеріңізді қолданыңыз. Оқу орнының AI ережелерін сақтаңыз. Тексеру түпнұсқалықты дәлелдемейді.',
  accept: 'Ұсынылған түзетуді қабылдау',
  dismiss: 'Қабылдамау',
  resolved: 'Шешілді',
  stale: 'Талдау ескірді: мәтін өзгерді. Қайта тексеріңіз.',
  locate: 'Үзіндіні көрсету',
  undo: 'Соңғы түзетуді қайтару',
  noReview:
    'Үзінділерге кеңес алу үшін тексеруді іске қосыңыз. Әр өлшемді өзіңіз белгілеңіз.',
  checklist: 'Автордың өзіндік тексеруі',
  ready: 'Мәтін дайын деп белгілеу',
  notReady: 'Бес өлшемді тексеріп, ашық пікірлерді қарап, шектерді сақтаңыз.',
  readyNotice:
    'Сіз мәтінді дайын деп белгіледіңіз. Бұл өтінімді жібермейді және қабылдау шешімін өзгертпейді.',
  compare: 'Қазіргі мәтінмен салыстыру',
  restore: 'Жаңа нұсқа ретінде қалпына келтіру',
  before: 'Бұрынғы нұсқа',
  after: 'Қазіргі мәтін',
  noVersions: 'Нұсқалар әлі жоқ. Алғашқысы сәтті сақтаудан кейін пайда болады.',
  restored: 'Жаңа нұсқаға қалпына келтірілді.',
  export: 'TXT экспорттау',
  print: 'Басып шығару / PDF сақтау',
  exportHelp:
    'TXT Unicode таңбаларын сақтайды. PDF браузердің басып шығару терезесі арқылы; DOCX қолжетімсіз.',
  cv: 'CV және белсенділік',
  addSection: 'Бөлім қосу',
  section: 'Бөлім',
  heading: 'Рөл / біліктілік / жоба',
  details: 'Сіздің үлесіңіз және дәлелдер',
  start: 'Басталуы (ЖЖЖЖ-АА)',
  end: 'Аяқталуы (ЖЖЖЖ-АА)',
  moveUp: 'Жоғары',
  moveDown: 'Төмен',
  remove: 'Бөлімді жою',
  preview: 'Құжатты алдын ала қарау',
  dateError: 'ЖЖЖЖ-АА енгізіңіз; аяқталуы басталуынан бұрын болмауы керек.',
  interview: 'Сұхбатқа дайындық',
  scenario: 'Жаттығу тақырыбы',
  startPractice: 'Жаттығуды бастау',
  pause: 'Үзіліс',
  resume: 'Жалғастыру',
  finish: 'Жаттығуды аяқтау',
  next: 'Келесі сұрақ',
  answer: 'Жауабыңыз',
  practicePrivacy:
    'Жауаптар тек осы қойындыда қалады. Оларды құпия жобаға сақтау үшін тарихты қосыңыз.',
  remember: 'Құпия жаттығу тарихын сақтау',
  generalPractice: 'Жалпы жаттығу; университеттің ресми сұхбаты емес.',
  paused: 'Жаттығу үзілісте',
  finished: 'Жаттығу аяқталды',
  emailTemplate: 'Өңделетін хат үлгісін қосу',
  emailScaffold:
    'Тақырып: [Бағдарлама / талап] туралы сұрақ\n\nҚұрметті қабылдау комиссиясы,\n\nМен [бағдарлама мен қабылдау жылын] қарастырып жүрмін. [Ресми дереккөзді] оқып, [бір нақты сұрақты] білгім келеді.\n\nУақытыңызға рақмет.\n[Атыңыз]',
  translation:
    'Үлгілер мен сұрақтар интерфейс тілінде. Сіздің мәтініңіз аударылмайды.',
  policy: 'Оқу орнының AI ережелері',
  cycle: 'Қабылдау циклі',
  verifiedAt: 'Тексерілген',
  noApplications: 'Белсенді өтінімдер жоқ; жалпы мәтін қолжетімді.',
  removeSource: 'Өз тапсырмамды қолдану',
  discard: 'Жергілікті өзгерістерді болдырмау',
  progress: 'Өзіндік тексерудің аяқталған өлшемдері',
  sectionPrivacy:
    'Экспорттағыңыз келетін байланыстарды ғана қосыңыз. Профиль деректері автоматты енгізілмейді.',
  statusReady: 'Дайын (өзіндік тексеру)',
  statusDraft: 'Жазылуда',
};
export const writingCopy: Record<Locale, Copy> = { en, ru, kk };
export const kindCopy: Record<Locale, Record<string, string>> = {
  en: {
    personal_statement: 'Personal statement',
    supplemental: 'Supplemental essay',
    sop: 'Statement of purpose',
    motivation: 'Motivation letter',
    scholarship: 'Scholarship essay',
    research: 'Research / portfolio',
    cv: 'CV / résumé',
    activities: 'Activities',
    email: 'Admissions email',
    interview: 'Interview practice',
    essay: 'Essay',
  },
  ru: {
    personal_statement: 'Личное эссе',
    supplemental: 'Дополнительное эссе',
    sop: 'Statement of Purpose',
    motivation: 'Мотивационное письмо',
    scholarship: 'Эссе на стипендию',
    research: 'Исследование / портфолио',
    cv: 'CV / резюме',
    activities: 'Активности',
    email: 'Письмо в приёмную комиссию',
    interview: 'Практика интервью',
    essay: 'Эссе',
  },
  kk: {
    personal_statement: 'Жеке эссе',
    supplemental: 'Қосымша эссе',
    sop: 'Мақсат туралы мәлімдеме',
    motivation: 'Уәждемелік хат',
    scholarship: 'Стипендия эссесі',
    research: 'Зерттеу / портфолио',
    cv: 'CV / түйіндеме',
    activities: 'Белсенділік',
    email: 'Қабылдау комиссиясына хат',
    interview: 'Сұхбатқа дайындық',
    essay: 'Эссе',
  },
};
export const criterionCopy: Record<Locale, Record<string, string>> = {
  en: {
    clarity: 'Clarity',
    structure: 'Structure',
    specificity: 'Specificity',
    evidence: 'Evidence',
    voice: 'Voice',
  },
  ru: {
    clarity: 'Ясность',
    structure: 'Структура',
    specificity: 'Конкретность',
    evidence: 'Подтверждения',
    voice: 'Личный голос',
  },
  kk: {
    clarity: 'Айқындық',
    structure: 'Құрылым',
    specificity: 'Нақтылық',
    evidence: 'Дәлелдер',
    voice: 'Жеке үн',
  },
};
export const reviewCopy: Record<Locale, Record<string, string>> = {
  en: {
    paragraphs:
      'This is one long paragraph. Where does the next idea begin? Add a paragraph break there.',
    longSentence:
      'This sentence has more than 35 words. Consider separating its main idea from the supporting detail.',
    repeated:
      'A word repeats consecutively. Remove the duplicate if it is accidental.',
    reflection:
      'Reflection question: what did you learn, and why does it matter to your next step?',
    specificity:
      'Reflection question: which action in this passage was yours? Add one truthful detail or example.',
  },
  ru: {
    paragraphs:
      'Здесь один длинный абзац. Где начинается следующая мысль? Добавьте там разрыв абзаца.',
    longSentence:
      'В предложении больше 35 слов. Попробуйте отделить главную мысль от пояснения.',
    repeated: 'Слово повторяется подряд. Уберите повтор, если он случаен.',
    reflection:
      'Вопрос для размышления: чему вы научились и почему это важно для следующего шага?',
    specificity:
      'Вопрос для размышления: какое действие здесь совершили именно вы? Добавьте реальную деталь или пример.',
  },
  kk: {
    paragraphs:
      'Бұл бір ұзын абзац. Келесі ой қай жерден басталады? Сол жерден жаңа абзац бастаңыз.',
    longSentence:
      'Сөйлемде 35-тен көп сөз бар. Негізгі ойды түсіндірмеден бөліп көріңіз.',
    repeated: 'Сөз қатарынан қайталанған. Кездейсоқ болса, қайталауды жойыңыз.',
    reflection:
      'Ойлану сұрағы: не үйрендіңіз және бұл келесі қадамыңыз үшін неліктен маңызды?',
    specificity:
      'Ойлану сұрағы: осы үзіндідегі қай әрекетті өзіңіз жасадыңыз? Шынайы дерек не мысал қосыңыз.',
  },
};
export const sectionCopy: Record<
  Locale,
  Record<
    | 'education'
    | 'experience'
    | 'projects'
    | 'awards'
    | 'activities'
    | 'skills'
    | 'languages',
    string
  >
> = {
  en: {
    education: 'Education',
    experience: 'Experience',
    projects: 'Projects / research',
    awards: 'Awards',
    activities: 'Activities / volunteering',
    skills: 'Skills',
    languages: 'Languages',
  },
  ru: {
    education: 'Образование',
    experience: 'Опыт',
    projects: 'Проекты / исследования',
    awards: 'Награды',
    activities: 'Активности / волонтёрство',
    skills: 'Навыки',
    languages: 'Языки',
  },
  kk: {
    education: 'Білім',
    experience: 'Тәжірибе',
    projects: 'Жобалар / зерттеу',
    awards: 'Марапаттар',
    activities: 'Белсенділік / еріктілік',
    skills: 'Дағдылар',
    languages: 'Тілдер',
  },
};
export const guidanceCopy: Record<Locale, Record<string, string>> = {
  en: {
    personal_statement:
      'Start with a real moment. Show what you did, what changed, and what you learned in your own voice.',
    supplemental:
      'Answer the exact question. Separate each requested part and verify the school’s current instructions.',
    sop: 'Connect your academic interests, actual preparation, and research questions. Verify program fit with official sources.',
    motivation:
      'Explain why this opportunity matters to your goals. Support your motivation with a real example.',
    scholarship:
      'Answer the funding prompt with truthful goals and evidence of contribution. Do not invent hardship or eligibility.',
    research:
      'Describe your question, method, own contribution and limitations. Credit collaborators accurately.',
    cv: 'Build from your real education, experience and contributions. Leave unsupported metrics and qualifications out.',
    activities:
      'Describe your actual role, dates, actions and results. Add hours or impact only when you can substantiate them.',
    email:
      'Ask one clear question after checking the official instructions. Replace every placeholder before using a template.',
    interview:
      'Practice a truthful answer, then reflect on clarity, evidence and what you would improve.',
    essay:
      'Write your own first draft. Use the prompt to decide what belongs and what can be removed.',
  },
  ru: {
    personal_statement:
      'Начните с реального эпизода. Покажите свои действия, изменения и выводы, сохраняя свой голос.',
    supplemental:
      'Ответьте на точный вопрос. Разделите части задания и проверьте актуальные инструкции учебного заведения.',
    sop: 'Свяжите академические интересы, реальную подготовку и исследовательские вопросы. Соответствие программе проверяйте по официальным источникам.',
    motivation:
      'Объясните связь возможности со своими целями. Подкрепите мотивацию реальным примером.',
    scholarship:
      'Ответьте на вопрос стипендии, опираясь на реальные цели и вклад. Не выдумывайте трудности или соответствие условиям.',
    research:
      'Опишите вопрос, метод, свой вклад и ограничения. Корректно укажите вклад соавторов.',
    cv: 'Указывайте реальное образование, опыт и вклад. Не добавляйте неподтверждённые показатели и квалификации.',
    activities:
      'Опишите реальную роль, даты, действия и результаты. Часы и влияние указывайте только с подтверждением.',
    email:
      'Задайте один ясный вопрос после чтения официальных инструкций. Замените все поля шаблона перед использованием.',
    interview:
      'Потренируйте правдивый ответ, затем оцените ясность, подтверждения и возможные улучшения.',
    essay:
      'Напишите свой первый черновик. Задание поможет решить, что оставить, а что убрать.',
  },
  kk: {
    personal_statement:
      'Шынайы оқиғадан бастаңыз. Өз әрекетіңізді, өзгерісті және үйренгеніңізді өз үніңізбен көрсетіңіз.',
    supplemental:
      'Нақты сұраққа жауап беріңіз. Тапсырма бөліктерін ажыратып, оқу орнының өзекті нұсқауларын тексеріңіз.',
    sop: 'Академиялық қызығушылықты, нақты дайындығыңызды және зерттеу сұрақтарын байланыстырыңыз. Бағдарламаға сәйкестікті ресми дереккөзден тексеріңіз.',
    motivation:
      'Мүмкіндіктің мақсаттарыңызға байланысын түсіндіріңіз. Уәжіңізді шынайы мысалмен растаңыз.',
    scholarship:
      'Стипендия сұрағына шынайы мақсат пен үлес дәлелдеріне сүйеніп жауап беріңіз. Қиындықты не талапқа сәйкестікті ойдан қоспаңыз.',
    research:
      'Сұрақты, әдісті, өз үлесіңізді және шектеулерді сипаттаңыз. Қатысушылардың үлесін дұрыс көрсетіңіз.',
    cv: 'Нақты біліміңізді, тәжірибеңізді және үлесіңізді жазыңыз. Расталмаған көрсеткіш пен біліктілікті қоспаңыз.',
    activities:
      'Нақты рөліңізді, мерзімді, әрекетті және нәтижені сипаттаңыз. Сағат пен ықпалды тек растағанда қосыңыз.',
    email:
      'Ресми нұсқауларды оқып, бір айқын сұрақ қойыңыз. Үлгінің барлық өрісін қолданар алдында ауыстырыңыз.',
    interview:
      'Шынайы жауапты жаттықтырып, айқындықты, дәлелді және жақсарту жолын ойластырыңыз.',
    essay:
      'Алғашқы қолжазбаны өзіңіз жазыңыз. Нені қалдыру не алып тастау керегін тапсырмаға сүйеніп шешіңіз.',
  },
};
