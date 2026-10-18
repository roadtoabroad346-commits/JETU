import type { Locale } from './messages';

export const marketingSlugs = [
  'about',
  'how-it-works',
  'scholarships',
  'universities',
  'opportunities',
  'pricing',
  'for-schools',
  'mentors',
  'faq',
  'contact',
  'privacy',
  'terms',
] as const;
export type MarketingSlug = (typeof marketingSlugs)[number];
export const isMarketingSlug = (value: string): value is MarketingSlug =>
  marketingSlugs.some((slug) => slug === value);

type PageContent = {
  title: string;
  description: string;
  sections: { heading: string; body: string }[];
};
type MarketingContent = {
  nav: string;
  navLinks: { slug: MarketingSlug; label: string }[];
  availability: string;
  home: string;
  explore: string;
  demo: string;
  demoNote: string;
  matching: string;
  essay: string;
  previewMatch: string;
  previewMatchBody: string;
  previewEssay: string;
  previewEssayBody: string;
  heroTitle: string;
  heroDescription: string;
  heroAction: string;
  heroSecondary: string;
  sectionJourney: string;
  sectionJourneyIntro: string;
  steps: { title: string; body: string }[];
  sectionTools: string;
  tools: { title: string; body: string; slug: MarketingSlug }[];
  sectionTrust: string;
  trustBody: string;
  sectionPricing: string;
  pricingBody: string;
  sectionFaq: string;
  faq: { question: string; answer: string }[];
  finalTitle: string;
  finalBody: string;
  footer: string;
  pages: Record<MarketingSlug, PageContent>;
};

export const marketing: Record<Locale, MarketingContent> = {
  ru: {
    nav: 'Основная навигация',
    navLinks: [
      { slug: 'how-it-works', label: 'Как это работает' },
      { slug: 'scholarships', label: 'Стипендии' },
      { slug: 'universities', label: 'Университеты' },
      { slug: 'pricing', label: 'Тарифы' },
      { slug: 'for-schools', label: 'Для школ' },
    ],
    availability: 'Платформа в разработке',
    home: 'Главная',
    explore: 'Смотреть раздел',
    demo: 'Демонстрация концепции',
    demoNote:
      'Демо: вымышленные примеры, без реальных рекомендаций или ответа ИИ.',
    matching: 'Поиск пути',
    essay: 'Работа над эссе',
    previewMatch: 'Начните с важных вопросов',
    previewMatchBody:
      'Страна, направление, бюджет, язык и сроки помогают сузить поиск. Проверяйте требования и финансирование на официальном сайте программы.',
    previewEssay: 'Сделайте текст конкретнее',
    previewEssayBody:
      'Пример подсказки: вместо общего «я люблю науку» опишите проект, вашу роль и результат. Это учебный пример, не проверка эссе ИИ.',
    heroTitle: 'От профиля до оффера — с ясным планом.',
    heroDescription:
      'Строим JETU для студентов Центральной Азии: программы, финансирование и подготовка заявки — в одном понятном пути.',
    heroAction: 'Как искать возможности',
    heroSecondary: 'Как это работает',
    sectionJourney: 'Путь, который можно понять',
    sectionJourneyIntro:
      'Три шага от вопросов о себе к проверенному плану действий.',
    steps: [
      {
        title: 'Определите отправную точку',
        body: 'Соберите интересы, учебный опыт, языки, бюджет и важные для вас условия.',
      },
      {
        title: 'Сравните варианты',
        body: 'Читайте требования, сроки и типы финансирования в первоисточниках.',
      },
      {
        title: 'Составьте план',
        body: 'Разбейте подготовку документов и эссе на выполнимые задачи. Сверяйте сроки перед подачей.',
      },
    ],
    sectionTools: 'Что JETU планирует объединить',
    tools: [
      {
        title: 'Стипендии',
        body: 'Различайте покрытие обучения, проживания и прочих расходов.',
        slug: 'scholarships',
      },
      {
        title: 'Университеты',
        body: 'Сравнивайте программы по требованиям, языку и источнику данных.',
        slug: 'universities',
      },
      {
        title: 'ИИ-коуч и эссе',
        body: 'Планируем подсказки для размышления. ИИ может ошибаться; авторство и проверка фактов остаются за вами.',
        slug: 'how-it-works',
      },
      {
        title: 'План подготовки',
        body: 'Разбивайте путь на задачи, документы и сроки; важные даты сверяйте в первоисточнике.',
        slug: 'how-it-works',
      },
      {
        title: 'Наставники',
        body: 'Узнайте, как мы подходим к проверке опыта и границам консультаций.',
        slug: 'mentors',
      },
      {
        title: 'Для школ',
        body: 'Планируем поддержку консультантов с отдельными ролями и защитой данных учеников.',
        slug: 'for-schools',
      },
    ],
    sectionTrust: 'Доверие начинается с источника',
    trustBody:
      'На JETU пока нет опубликованного проверенного каталога. Когда записи появятся, каждая должна показывать официальный источник, дату проверки и точные условия. Решение о зачислении и финансировании всегда принимает организация, а не JETU или ИИ.',
    sectionPricing: 'Прозрачность до оплаты',
    pricingBody:
      'Платные планы и оплата ещё не открыты. Мы опубликуем цену, состав услуг и условия до запуска продаж.',
    sectionFaq: 'Короткие ответы',
    faq: [
      {
        question: 'Можно ли сейчас создать аккаунт?',
        answer:
          'Пока нет. Регистрация и личный кабинет появятся после проверки основных функций и безопасности.',
      },
      {
        question: 'JETU гарантирует поступление или стипендию?',
        answer:
          'Нет. Решения принимают университеты и стипендиальные организации. Инструменты JETU могут помогать с подготовкой, но не заменяют официальные требования.',
      },
      {
        question: 'Откуда будут данные о стипендиях?',
        answer:
          'Планируется указывать официальный источник, дату проверки, требования и состав покрытия для каждой записи. Проверенного каталога пока нет.',
      },
    ],
    finalTitle: 'Начните с надёжной информации.',
    finalBody:
      'Изучите, как проверять возможности, и возвращайтесь за новыми инструментами по мере запуска.',
    footer:
      'JETU Admissions · создаём более ясный путь к международному образованию.',
    pages: {
      about: {
        title: 'О JETU',
        description:
          'JETU создаётся для студентов Центральной Азии, которым нужен понятный путь к зарубежному образованию.',
        sections: [
          {
            heading: 'Для кого мы строим платформу',
            body: 'Для студентов и семей, которым сложно сравнить требования, сроки, расходы и источники помощи в разных странах.',
          },
          {
            heading: 'Что уже доступно',
            body: 'Сейчас доступны публичные объяснения подхода и демонстрация интерфейса. Персональные аккаунты и подбор ещё не открыты.',
          },
        ],
      },
      'how-it-works': {
        title: 'Как это будет работать',
        description:
          'Профиль, проверка возможностей и план подготовки в одном последовательном пути.',
        sections: [
          {
            heading: '1. Отправная точка',
            body: 'Опишите образование, интересы, язык и ограничения. Не публикуйте личные документы до запуска защищённого кабинета.',
          },
          {
            heading: '2. Поиск и проверка',
            body: 'Сопоставьте требования программ и стипендий с официальными источниками. Смотрите даты обновления и различайте полный грант и покрытие обучения.',
          },
          {
            heading: '3. Подготовка заявки',
            body: 'Планируйте документы и эссе заранее. ИИ-подсказки, когда они появятся, потребуют проверки человеком и не смогут обещать результат.',
          },
        ],
      },
      scholarships: {
        title: 'Стипендии: сначала условия',
        description:
          'Узнайте, как оценивать финансирование. Проверенный поиск стипендий ещё готовится.',
        sections: [
          {
            heading: 'Каталог готовится',
            body: 'Проверенных записей для поиска пока нет. Мы не показываем придуманные дедлайны, суммы или «полное покрытие».',
          },
          {
            heading: 'Что сравнивать',
            body: 'Проверьте право на участие, программу, дедлайн, валюту и отдельно обучение, проживание, дорогу и страховку.',
          },
          {
            heading: 'Первоисточник важнее',
            body: 'Перед подачей откройте официальный сайт грантодателя и сверьте текущие правила. Дата проверки должна быть видна рядом с каждой будущей записью JETU.',
          },
        ],
      },
      universities: {
        title: 'Университеты и программы',
        description: 'Метод выбора программ до запуска проверенного каталога.',
        sections: [
          {
            heading: 'Поиск готовится',
            body: 'Сейчас JETU не публикует перечень университетов или автоматические шансы поступления.',
          },
          {
            heading: 'Сравнивайте по делу',
            body: 'Смотрите аккредитацию, программу, язык, вступительные требования, стоимость и сроки на официальных страницах.',
          },
        ],
      },
      opportunities: {
        title: 'Как искать возможности',
        description:
          'Практический подход к поиску программ и финансирования без ложных рекомендаций.',
        sections: [
          {
            heading: 'Начните с рамок поиска',
            body: 'Запишите направление, страны, язык, бюджет и год поступления. Это поможет отличить подходящий вариант от привлекательной рекламы.',
          },
          {
            heading: 'Сверьте ключевые условия',
            body: 'Проверьте право на участие, дедлайн, расходы и список документов в первоисточнике. Сохраняйте ссылку и дату проверки для себя.',
          },
          {
            heading: 'Персональный подбор ещё закрыт',
            body: 'Мы откроем поиск и аккаунты после проверки данных, доступа и сохранения профиля. Сейчас эта страница служит руководством, а не выдачей результатов.',
          },
        ],
      },
      pricing: {
        title: 'Тарифы и оплата',
        description:
          'Платные планы JETU пока не опубликованы и покупки недоступны.',
        sections: [
          {
            heading: 'Продажи ещё не открыты',
            body: 'Нет утверждённого публичного прайса, действующих подписок или кнопки оплаты. Цифры из ранней презентации были гипотезой, а не предложением.',
          },
          {
            heading: 'До запуска оплаты',
            body: 'Мы явно покажем стоимость, что входит в план, правила отмены и поддержки. Бесплатные публичные материалы остаются доступны без регистрации.',
          },
        ],
      },
      'for-schools': {
        title: 'JETU для школ',
        description:
          'Планируемый подход к поддержке школьных консультантов и студентов.',
        sections: [
          {
            heading: 'Школьный сценарий',
            body: 'Консультантам нужна понятная картина сроков и требований, а студентам — свой план. Рабочее пространство для школ ещё не открыто.',
          },
          {
            heading: 'Данные и доступ',
            body: 'Будущие роли и согласия должны защищать данные учащихся. До проверки доступа мы не принимаем школьные списки или заявки через сайт.',
          },
        ],
      },
      mentors: {
        title: 'Наставники',
        description:
          'Как JETU планирует поддержку наставников и проверку опыта.',
        sections: [
          {
            heading: 'Сеть формируется',
            body: 'Бронирование и оплата консультаций пока недоступны. На сайте нет подтверждённых анкет наставников.',
          },
          {
            heading: 'Без обещаний результата',
            body: 'Наставник может помочь с процессом и обратной связью, но не влияет на решение приёмной комиссии.',
          },
        ],
      },
      faq: {
        title: 'Частые вопросы',
        description: 'Ответы о доступности JETU, источниках, ИИ и результатах.',
        sections: [
          {
            heading: 'Когда появится личный кабинет?',
            body: 'Публичной даты пока нет. Мы сообщим о доступности после проверки регистрации и безопасности.',
          },
          {
            heading: 'Можно ли доверять подсказкам ИИ?',
            body: 'ИИ может ошибаться. Все условия, сроки и факты нужно сверять с официальными источниками; решение о поступлении всегда принимает организация.',
          },
          {
            heading: 'Есть ли подтверждённые стипендии?',
            body: 'Проверенный каталог ещё не опубликован. Мы не отображаем вымышленные записи.',
          },
        ],
      },
      contact: {
        title: 'Связаться с JETU',
        description:
          'Информация о каналах связи и текущей доступности команды.',
        sections: [
          {
            heading: 'Канал связи готовится',
            body: 'Публичная форма и подтверждённый адрес поддержки пока не настроены. Не отправляйте личные документы через сторонние каналы от имени JETU.',
          },
          {
            heading: 'Для школ и партнёров',
            body: 'Партнёрский процесс появится после публикации официального контакта и условий обработки данных.',
          },
        ],
      },
      privacy: {
        title: 'Конфиденциальность',
        description: 'Что обрабатывает этот публичный сайт на текущем этапе.',
        sections: [
          {
            heading: 'Текущий сайт',
            body: 'Эти публичные страницы не предлагают регистрацию или отправку документов. Переключение языка и демо-превью работают без сохранения профиля.',
          },
          {
            heading: 'Технические данные',
            body: 'Хостинг может обрабатывать стандартные данные запроса для доставки страниц и защиты сервиса. Перед запуском аккаунтов будет опубликована подробная политика с оператором, сроками хранения и контактами.',
          },
        ],
      },
      terms: {
        title: 'Условия использования',
        description: 'Границы использования публичных материалов JETU.',
        sections: [
          {
            heading: 'Информационный характер',
            body: 'Материалы сайта помогают ориентироваться, но не являются решением университета, грантодателя или иммиграционного органа.',
          },
          {
            heading: 'Проверяйте первоисточники',
            body: 'Требования, цены и сроки могут меняться. Перед действием сверяйте их на официальных сайтах соответствующих организаций.',
          },
          {
            heading: 'Сервисы в разработке',
            body: 'На текущем этапе сайт не предлагает аккаунты, платежи, консультации или отправку заявок.',
          },
        ],
      },
    },
  },
  kk: {
    nav: 'Негізгі навигация',
    navLinks: [
      { slug: 'how-it-works', label: 'Қалай жұмыс істейді' },
      { slug: 'scholarships', label: 'Стипендиялар' },
      { slug: 'universities', label: 'Университеттер' },
      { slug: 'pricing', label: 'Тарифтер' },
      { slug: 'for-schools', label: 'Мектептерге' },
    ],
    availability: 'Платформа әзірленуде',
    home: 'Басты бет',
    explore: 'Бөлімді қарау',
    demo: 'Тұжырымдама көрсетілімі',
    demoNote:
      'Демо: ойдан алынған мысалдар; нақты ұсыныс немесе ЖИ жауабы емес.',
    matching: 'Жолды іздеу',
    essay: 'Эссемен жұмыс',
    previewMatch: 'Маңызды сұрақтардан бастаңыз',
    previewMatchBody:
      'Ел, мамандық, бюджет, тіл және мерзім іздеуді нақтылауға көмектеседі. Талаптар мен қаржыландыруды бағдарламаның ресми сайтынан тексеріңіз.',
    previewEssay: 'Мәтінді нақтылаңыз',
    previewEssayBody:
      'Мысал: «ғылымды жақсы көремін» деудің орнына жобаңызды, рөліңізді және нәтижені сипаттаңыз. Бұл ЖИ тексеруі емес, оқу мысалы.',
    heroTitle: 'Профильден ұсынысқа дейін — айқын жоспармен.',
    heroDescription:
      'JETU Орталық Азия студенттеріне оқу бағдарламаларын, қаржыландыруды және өтінімге дайындықты түсінуге көмектесу үшін жасалып жатыр.',
    heroAction: 'Мүмкіндіктерді қалай іздеу керек',
    heroSecondary: 'Қалай жұмыс істейді',
    sectionJourney: 'Түсінікті жол',
    sectionJourneyIntro:
      'Өзіңіз туралы сұрақтардан тексерілген іс жоспарына дейінгі үш қадам.',
    steps: [
      {
        title: 'Бастапқы нүктені анықтаңыз',
        body: 'Қызығушылық, оқу тәжірибесі, тіл, бюджет және маңызды шарттарды жинақтаңыз.',
      },
      {
        title: 'Нұсқаларды салыстырыңыз',
        body: 'Талаптарды, мерзімдерді және қаржыландыру түрлерін ресми дереккөздерден оқыңыз.',
      },
      {
        title: 'Жоспар құрыңыз',
        body: 'Құжат пен эссе дайындауды шағын қадамдарға бөліңіз. Өтінім алдында мерзімді қайта тексеріңіз.',
      },
    ],
    sectionTools: 'JETU біріктіруді жоспарлаған құралдар',
    tools: [
      {
        title: 'Стипендиялар',
        body: 'Оқу, тұру және басқа шығындардың қайсысы жабылатынын ажыратыңыз.',
        slug: 'scholarships',
      },
      {
        title: 'Университеттер',
        body: 'Бағдарламаларды талап, тіл және дереккөз бойынша салыстырыңыз.',
        slug: 'universities',
      },
      {
        title: 'ЖИ кеңесші және эссе',
        body: 'Ойлануға көмектесетін кеңестер жоспарланған. ЖИ қателесуі мүмкін; авторлық пен фактіні тексеру өзіңізде қалады.',
        slug: 'how-it-works',
      },
      {
        title: 'Дайындық жоспары',
        body: 'Жолды тапсырма, құжат және мерзімге бөліңіз; маңызды күндерді ресми дереккөзден тексеріңіз.',
        slug: 'how-it-works',
      },
      {
        title: 'Тәлімгерлер',
        body: 'Тәжірибені тексеру және кеңес беру шектеулері туралы біліңіз.',
        slug: 'mentors',
      },
      {
        title: 'Мектептерге',
        body: 'Кеңесшілерге бөлек рөлдер мен оқушы деректерін қорғау арқылы қолдау жоспарланған.',
        slug: 'for-schools',
      },
    ],
    sectionTrust: 'Сенім дереккөзден басталады',
    trustBody:
      'JETU сайтында тексерілген каталог әзірге жарияланбады. Жазбалар шыққанда әрқайсысында ресми дереккөз, тексеру күні және нақты шарттар көрсетілуі тиіс. Қабылдау мен қаржыландыру шешімін JETU немесе ЖИ емес, тиісті ұйым қабылдайды.',
    sectionPricing: 'Төлемге дейінгі ашықтық',
    pricingBody:
      'Ақылы жоспарлар мен төлем әлі ашылған жоқ. Сатылым басталмай тұрып баға, қызмет құрамы және шарттар жарияланады.',
    sectionFaq: 'Қысқа жауаптар',
    faq: [
      {
        question: 'Қазір тіркелуге бола ма?',
        answer:
          'Әзірге жоқ. Тіркелу мен жеке кабинет негізгі функциялар мен қауіпсіздік тексерілген соң ашылады.',
      },
      {
        question: 'JETU оқуға түсуге не стипендияға кепілдік бере ме?',
        answer:
          'Жоқ. Шешімді университеттер мен грант ұйымдары қабылдайды. JETU құралдары дайындыққа көмектесе алады, бірақ ресми талаптарды алмастырмайды.',
      },
      {
        question: 'Стипендия деректері қайдан алынады?',
        answer:
          'Әр жазбада ресми дереккөз, тексеру күні, талаптар және жабылатын шығындар көрсетілуі жоспарланған. Тексерілген каталог әлі жоқ.',
      },
    ],
    finalTitle: 'Сенімді ақпараттан бастаңыз.',
    finalBody:
      'Мүмкіндіктерді тексеру жолын оқып, жаңа құралдар іске қосылғанда қайта оралыңыз.',
    footer: 'JETU Admissions · халықаралық білімге айқынырақ жол құрамыз.',
    pages: {
      about: {
        title: 'JETU туралы',
        description:
          'JETU Орталық Азия студенттеріне шетелде оқу жолын түсінікті ету үшін жасалып жатыр.',
        sections: [
          {
            heading: 'Кім үшін',
            body: 'Әртүрлі елдің талаптарын, мерзімін, шығындарын және көмек көздерін салыстыру қиын студенттер мен отбасылар үшін.',
          },
          {
            heading: 'Қазір не бар',
            body: 'Әзірше ашық ақпарат пен интерфейс көрсетілімі бар. Жеке аккаунт пен іріктеу әлі ашылмады.',
          },
        ],
      },
      'how-it-works': {
        title: 'Қалай жұмыс істейді',
        description:
          'Профиль, мүмкіндіктерді тексеру және дайындық жоспары бірізді жолға бірігеді.',
        sections: [
          {
            heading: '1. Бастапқы нүкте',
            body: 'Біліміңізді, қызығушылығыңызды, тіліңізді және шектеулеріңізді анықтаңыз. Қорғалған кабинет ашылмайынша жеке құжаттарды жүктемеңіз.',
          },
          {
            heading: '2. Іздеу және тексеру',
            body: 'Бағдарлама мен стипендия шарттарын ресми дереккөздермен салыстырыңыз. Жаңарту күнін, толық грант пен тек оқу ақысын жабудың айырмасын қараңыз.',
          },
          {
            heading: '3. Өтінімге дайындық',
            body: 'Құжат пен эссені алдын ала жоспарлаңыз. ЖИ кеңестері пайда болғанда да, оларды адам тексеруі керек және нәтиже уәде ете алмайды.',
          },
        ],
      },
      scholarships: {
        title: 'Стипендиялар: алдымен шарттар',
        description:
          'Қаржыландыруды бағалау жолы. Тексерілген стипендия іздеуі әзірленуде.',
        sections: [
          {
            heading: 'Каталог әзірленуде',
            body: 'Іздеуге арналған тексерілген жазбалар әзірге жоқ. Біз ойдан шығарылған мерзімдерді, сомаларды немесе толық гранттарды көрсетпейміз.',
          },
          {
            heading: 'Нені салыстыру керек',
            body: 'Қатысу құқығын, бағдарламаны, мерзімді, валютаны және оқу, тұру, жол, сақтандыру шығындарын бөлек тексеріңіз.',
          },
          {
            heading: 'Ресми дереккөз маңызды',
            body: 'Өтінім алдында грант берушінің ресми сайтын қарап, ағымдағы шарттарды тексеріңіз. JETU-дің әр болашақ жазбасында тексеру күні көрсетілуі тиіс.',
          },
        ],
      },
      universities: {
        title: 'Университеттер мен бағдарламалар',
        description:
          'Тексерілген каталог іске қосылғанға дейін бағдарлама таңдау әдісі.',
        sections: [
          {
            heading: 'Іздеу әзірленуде',
            body: 'JETU қазір университет тізімін не түсу ықтималдығын жарияламайды.',
          },
          {
            heading: 'Маңыздысын салыстырыңыз',
            body: 'Аккредитацияны, бағдарламаны, тілді, қабылдау талаптарын, құнын және мерзімін ресми сайттардан қараңыз.',
          },
        ],
      },
      opportunities: {
        title: 'Мүмкіндіктерді қалай іздеу керек',
        description:
          'Жалған ұсыныстарсыз бағдарлама мен қаржыландыру іздеудің жолы.',
        sections: [
          {
            heading: 'Іздеу шеңберін белгілеңіз',
            body: 'Бағытты, елдерді, тілді, бюджетті және оқу жылын жазыңыз. Бұл жарнама мен жарамды нұсқаны ажыратуға көмектеседі.',
          },
          {
            heading: 'Негізгі шарттарды тексеріңіз',
            body: 'Қатысу құқығын, мерзімді, шығынды және құжаттарды ресми дереккөзден қараңыз. Сілтеме мен тексеру күнін сақтаңыз.',
          },
          {
            heading: 'Жеке іріктеу әлі жабық',
            body: 'Деректер, қолжетімділік және профиль сақталуы тексерілген соң іздеу мен аккаунттар ашылады. Бұл бет әзірге нұсқаулық қана.',
          },
        ],
      },
      pricing: {
        title: 'Тарифтер және төлем',
        description:
          'JETU ақылы жоспарлары әлі жарияланбады; төлем қолжетімсіз.',
        sections: [
          {
            heading: 'Сатылым ашылмады',
            body: 'Бекітілген ашық баға, жазылым немесе төлем батырмасы жоқ. Алғашқы презентациядағы сандар ұсыныс емес, болжам болған.',
          },
          {
            heading: 'Төлем іске қосылғанға дейін',
            body: 'Құнын, жоспар құрамын, бас тарту және қолдау шарттарын анық көрсетеміз. Ашық материалдар тіркеусіз қолжетімді.',
          },
        ],
      },
      'for-schools': {
        title: 'Мектептерге арналған JETU',
        description:
          'Мектеп кеңесшілері мен оқушыларды қолдаудың жоспарланған жолы.',
        sections: [
          {
            heading: 'Мектепке арналған жұмыс',
            body: 'Кеңесшіге мерзім мен талаптардың айқын көрінісі, оқушыға жеке жоспар қажет. Мектеп кабинеті әлі ашылған жоқ.',
          },
          {
            heading: 'Дерек пен қолжетімділік',
            body: 'Болашақ рөлдер мен келісімдер оқушы деректерін қорғауы тиіс. Тексеру аяқталғанша сайт арқылы мектеп тізімдері мен өтінімдерді қабылдамаймыз.',
          },
        ],
      },
      mentors: {
        title: 'Тәлімгерлер',
        description:
          'JETU тәлімгер қолдауын және тәжірибені тексеруді қалай жоспарлайды.',
        sections: [
          {
            heading: 'Желі қалыптасуда',
            body: 'Кеңесті брондау және төлеу қолжетімсіз. Сайтта расталған тәлімгер анкеталары жоқ.',
          },
          {
            heading: 'Нәтижеге кепілдік жоқ',
            body: 'Тәлімгер дайындық пен кері байланысқа көмектесе алады, бірақ қабылдау комиссиясының шешіміне әсер етпейді.',
          },
        ],
      },
      faq: {
        title: 'Жиі қойылатын сұрақтар',
        description:
          'JETU қолжетімділігі, дереккөздер, ЖИ және нәтижелер туралы жауаптар.',
        sections: [
          {
            heading: 'Жеке кабинет қашан ашылады?',
            body: 'Әзірге ашық күні жоқ. Тіркелу мен қауіпсіздік тексерілген соң хабарлаймыз.',
          },
          {
            heading: 'ЖИ кеңестеріне сенуге бола ма?',
            body: 'ЖИ қателесуі мүмкін. Барлық шарт, мерзім және факт ресми дереккөзден тексерілуі тиіс; қабылдау шешімін ұйым қабылдайды.',
          },
          {
            heading: 'Расталған стипендиялар бар ма?',
            body: 'Тексерілген каталог әлі жарияланбады. Ойдан шығарылған жазбаларды көрсетпейміз.',
          },
        ],
      },
      contact: {
        title: 'JETU-мен байланыс',
        description:
          'Байланыс арналары мен команданың ағымдағы қолжетімділігі.',
        sections: [
          {
            heading: 'Байланыс арнасы әзірленуде',
            body: 'Ашық форма мен расталған қолдау мекенжайы әзірше бапталмаған. Жеке құжаттарды JETU атынан әрекет ететін бөгде арналарға жібермеңіз.',
          },
          {
            heading: 'Мектептер мен серіктестерге',
            body: 'Серіктестік тәртібі ресми байланыс пен деректерді өңдеу шарттары жарияланған соң пайда болады.',
          },
        ],
      },
      privacy: {
        title: 'Құпиялылық',
        description: 'Осы кезеңде ашық сайт қандай деректерді өңдейді.',
        sections: [
          {
            heading: 'Қазіргі сайт',
            body: 'Бұл беттерде тіркелу не құжат жіберу жоқ. Тіл ауыстыру мен демо профильді сақтамайды.',
          },
          {
            heading: 'Техникалық деректер',
            body: 'Хостинг беттерді жеткізу және қорғау үшін сұраудың стандартты деректерін өңдеуі мүмкін. Аккаунттар іске қосылмай тұрып оператор, сақтау мерзімі және байланыс көрсетілген толық саясат жарияланады.',
          },
        ],
      },
      terms: {
        title: 'Пайдалану шарттары',
        description: 'JETU ашық материалдарын пайдаланудың шеңбері.',
        sections: [
          {
            heading: 'Ақпараттық сипат',
            body: 'Сайт материалдары бағдар алуға көмектеседі, бірақ университеттің, грант берушінің не көші-қон органының шешімі емес.',
          },
          {
            heading: 'Ресми дереккөзді тексеріңіз',
            body: 'Талаптар, бағалар және мерзімдер өзгеруі мүмкін. Әрекет алдында тиісті ұйымның ресми сайтынан тексеріңіз.',
          },
          {
            heading: 'Қызметтер әзірленуде',
            body: 'Қазір сайт аккаунт, төлем, кеңес не өтінім жіберуді ұсынбайды.',
          },
        ],
      },
    },
  },
  en: {
    nav: 'Primary navigation',
    navLinks: [
      { slug: 'how-it-works', label: 'How it works' },
      { slug: 'scholarships', label: 'Scholarships' },
      { slug: 'universities', label: 'Universities' },
      { slug: 'pricing', label: 'Pricing' },
      { slug: 'for-schools', label: 'For schools' },
    ],
    availability: 'Platform in development',
    home: 'Home',
    explore: 'Explore section',
    demo: 'Concept demonstration',
    demoNote:
      'Demo: illustrative examples, with no live recommendations or AI response.',
    matching: 'Find a path',
    essay: 'Work on an essay',
    previewMatch: 'Start with useful questions',
    previewMatchBody:
      'Country, subject, budget, language and timing can narrow a search. Verify requirements and funding on the program’s official site.',
    previewEssay: 'Make the writing specific',
    previewEssayBody:
      'Example prompt: instead of “I love science,” describe a project, your role and its result. This is a teaching example, not an AI essay review.',
    heroTitle: 'From profile to offer, with a clearer plan.',
    heroDescription:
      'We are building JETU for Central Asian students to navigate programs, funding and application preparation in one clearer path.',
    heroAction: 'How to find opportunities',
    heroSecondary: 'How it works',
    sectionJourney: 'A path you can understand',
    sectionJourneyIntro:
      'Three steps from questions about yourself to an informed action plan.',
    steps: [
      {
        title: 'Know your starting point',
        body: 'Gather your interests, academic experience, languages, budget and priorities.',
      },
      {
        title: 'Compare options',
        body: 'Read requirements, deadlines and funding types from official sources.',
      },
      {
        title: 'Make a plan',
        body: 'Break documents and essays into manageable tasks. Recheck dates before applying.',
      },
    ],
    sectionTools: 'What JETU plans to bring together',
    tools: [
      {
        title: 'Scholarships',
        body: 'Distinguish tuition support from living and other costs.',
        slug: 'scholarships',
      },
      {
        title: 'Universities',
        body: 'Compare programs by requirements, language and source.',
        slug: 'universities',
      },
      {
        title: 'AI coach and essays',
        body: 'Thinking prompts are planned. AI can be wrong; you keep authorship and responsibility for checking facts.',
        slug: 'how-it-works',
      },
      {
        title: 'Preparation roadmap',
        body: 'Break the journey into tasks, documents and dates, then confirm critical deadlines at the source.',
        slug: 'how-it-works',
      },
      {
        title: 'Mentors',
        body: 'Learn how experience and the limits of advice should be checked.',
        slug: 'mentors',
      },
      {
        title: 'For schools',
        body: 'Support for counselors is planned with distinct roles and protection of student data.',
        slug: 'for-schools',
      },
    ],
    sectionTrust: 'Trust starts with a source',
    trustBody:
      'JETU does not yet publish a verified catalog. When records become available, each should show an official source, a review date and exact terms. Admissions and funding decisions belong to the institution, never to JETU or AI.',
    sectionPricing: 'Clarity before payment',
    pricingBody:
      'Paid plans and checkout are not open. We will publish the price, included services and terms before sales start.',
    sectionFaq: 'Quick answers',
    faq: [
      {
        question: 'Can I create an account now?',
        answer:
          'Not yet. Registration and a personal workspace will open after the core features and security have been checked.',
      },
      {
        question: 'Does JETU guarantee admission or a scholarship?',
        answer:
          'No. Universities and scholarship organizations make those decisions. JETU tools may support preparation but cannot replace official requirements.',
      },
      {
        question: 'Where will scholarship information come from?',
        answer:
          'The plan is to show an official source, review date, eligibility and coverage for each record. A verified catalog is not available yet.',
      },
    ],
    finalTitle: 'Begin with reliable information.',
    finalBody:
      'Learn how to check opportunities and return as new tools become available.',
    footer:
      'JETU Admissions · building a clearer path to international education.',
    pages: {
      about: {
        title: 'About JETU',
        description:
          'JETU is being built for Central Asian students seeking a clearer path to study abroad.',
        sections: [
          {
            heading: 'Who it is for',
            body: 'Students and families who need to compare requirements, timing, costs and sources of support across countries.',
          },
          {
            heading: 'What is available',
            body: 'Public explanations and a concept interface are available now. Accounts and personal matching are not open.',
          },
        ],
      },
      'how-it-works': {
        title: 'How it will work',
        description:
          'A profile, verified opportunities and a preparation plan in one coherent journey.',
        sections: [
          {
            heading: '1. Starting point',
            body: 'Understand your studies, interests, language and constraints. Do not submit personal documents until a secure workspace is available.',
          },
          {
            heading: '2. Search and verify',
            body: 'Compare program and scholarship terms against official sources. Check review dates and distinguish full funding from tuition only.',
          },
          {
            heading: '3. Prepare to apply',
            body: 'Plan documents and essays early. Future AI prompts will still need human review and cannot promise an outcome.',
          },
        ],
      },
      scholarships: {
        title: 'Scholarships: start with the terms',
        description:
          'Learn to assess funding. A verified scholarship search is still in development.',
        sections: [
          {
            heading: 'Catalog in progress',
            body: 'There are no verified records to search yet. We do not show invented deadlines, amounts or “full rides.”',
          },
          {
            heading: 'What to compare',
            body: 'Check eligibility, program, deadline, currency, and coverage of tuition, living costs, travel and insurance separately.',
          },
          {
            heading: 'Go to the source',
            body: 'Before applying, open the funder’s official site and check current rules. A review date should accompany every future JETU record.',
          },
        ],
      },
      universities: {
        title: 'Universities and programs',
        description:
          'A way to choose programs before the verified catalog launches.',
        sections: [
          {
            heading: 'Search in progress',
            body: 'JETU does not currently publish university listings or automated admission odds.',
          },
          {
            heading: 'Compare what matters',
            body: 'Check accreditation, course content, language, entry requirements, cost and dates on official pages.',
          },
        ],
      },
      opportunities: {
        title: 'How to find opportunities',
        description:
          'A practical way to look for programs and funding without invented recommendations.',
        sections: [
          {
            heading: 'Set your search boundaries',
            body: 'Write down subject, countries, language, budget and entry year. This helps separate a suitable option from attractive advertising.',
          },
          {
            heading: 'Check the critical terms',
            body: 'Verify eligibility, deadline, costs and documents with the official source. Keep the link and the date you checked it.',
          },
          {
            heading: 'Personal matching is not open yet',
            body: 'Search and accounts will open after data, access and profile storage are checked. This page is a guide, not a result list.',
          },
        ],
      },
      pricing: {
        title: 'Plans and pricing',
        description:
          'JETU has not published paid plans, and checkout is unavailable.',
        sections: [
          {
            heading: 'Sales are not open',
            body: 'There is no approved public price list, active subscription or payment button. Figures in an early pitch were hypotheses, not offers.',
          },
          {
            heading: 'Before payments launch',
            body: 'We will clearly state price, what is included, cancellation and support terms. Public materials remain accessible without registration.',
          },
        ],
      },
      'for-schools': {
        title: 'JETU for schools',
        description:
          'A planned approach to supporting school counselors and students.',
        sections: [
          {
            heading: 'The school use case',
            body: 'Counselors need a clear view of dates and requirements while students need their own plan. A school workspace is not open yet.',
          },
          {
            heading: 'Data and access',
            body: 'Future roles and consent must protect student data. We are not accepting school lists or applications through this site before access is tested.',
          },
        ],
      },
      mentors: {
        title: 'Mentors',
        description: 'How JETU plans mentor support and experience checks.',
        sections: [
          {
            heading: 'Network in progress',
            body: 'Booking and payment are unavailable. There are no verified mentor profiles on this site.',
          },
          {
            heading: 'No outcome promises',
            body: 'A mentor may help with process and feedback but cannot influence an admissions decision.',
          },
        ],
      },
      faq: {
        title: 'Frequently asked questions',
        description:
          'Answers about JETU availability, sources, AI and outcomes.',
        sections: [
          {
            heading: 'When will accounts open?',
            body: 'There is no public date yet. We will announce availability after registration and security are checked.',
          },
          {
            heading: 'Can I trust AI prompts?',
            body: 'AI can be wrong. Verify all terms, dates and facts with official sources; the institution makes the admission decision.',
          },
          {
            heading: 'Are there verified scholarships?',
            body: 'A verified catalog has not been published. We do not show fictional records.',
          },
        ],
      },
      contact: {
        title: 'Contact JETU',
        description:
          'Current information on contact channels and team availability.',
        sections: [
          {
            heading: 'Contact channel in progress',
            body: 'A public form and verified support address are not configured yet. Do not send personal documents through third-party channels claiming to be JETU.',
          },
          {
            heading: 'For schools and partners',
            body: 'A partnership process will follow the publication of an official contact and data-handling terms.',
          },
        ],
      },
      privacy: {
        title: 'Privacy',
        description: 'What this public site handles at its current stage.',
        sections: [
          {
            heading: 'Current site',
            body: 'These public pages offer no registration or document submission. Language selection and demo preview do not save a profile.',
          },
          {
            heading: 'Technical data',
            body: 'Hosting may process standard request data to deliver and protect pages. A fuller policy naming the operator, retention and contact will be published before accounts launch.',
          },
        ],
      },
      terms: {
        title: 'Terms of use',
        description: 'The scope of JETU public materials.',
        sections: [
          {
            heading: 'For information',
            body: 'Site materials help with orientation but are not decisions from a university, funder or immigration authority.',
          },
          {
            heading: 'Check primary sources',
            body: 'Requirements, prices and dates may change. Verify them on the relevant organization’s official site before acting.',
          },
          {
            heading: 'Services in development',
            body: 'At present this site does not offer accounts, payments, consultations or application submission.',
          },
        ],
      },
    },
  },
};
