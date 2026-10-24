export const locales = ['ru', 'kk', 'en'] as const;
export type Locale = (typeof locales)[number];
export const localeNames: Record<Locale, string> = {
  ru: 'Русский',
  kk: 'Қазақша',
  en: 'English',
};
export const isLocale = (value: string): value is Locale =>
  locales.some((locale) => locale === value);

export const messages = {
  ru: {
    title: 'Твоя следующая глава — без границ.',
    description:
      'Создаём JETU — платформу для студентов Центральной Азии, которые планируют учёбу за рубежом и ищут финансирование.',
    status: 'Готовимся к запуску',
    note: 'Регистрация и личный кабинет доступны. Каталог программ продолжает наполняться проверенными данными.',
    belief: 'Большие цели начинаются с ясного пути.',
    footer: 'Международное образование. Ближе к тебе.',
    language: 'Язык',
    skip: 'Перейти к содержимому',
    loading: 'Загрузка страницы…',
    error: 'Не удалось загрузить страницу',
    errorBody:
      'Попробуйте ещё раз. Если ошибка повторяется, вернитесь на главную.',
    retry: 'Попробовать снова',
    home: 'На главную',
    missing: 'Страница не найдена',
    missingBody:
      'Возможно, адрес изменился. Вернитесь на главную страницу JETU.',
  },
  kk: {
    title: 'Келесі белесің — шекарасыз.',
    description:
      'JETU — шетелде білім алуды жоспарлап, қаржыландыру іздеп жүрген Орталық Азия студенттеріне арналған платформа. Біз оны әзірлеп жатырмыз.',
    status: 'Іске қосуға дайындалып жатырмыз',
    note: 'Тіркелу мен жеке кабинет қолжетімді. Бағдарламалар каталогы тексерілген деректермен толықтырылуда.',
    belief: 'Үлкен мақсат айқын жолдан басталады.',
    footer: 'Халықаралық білім. Саған жақынырақ.',
    language: 'Тіл',
    skip: 'Негізгі мазмұнға өту',
    loading: 'Бет жүктелуде…',
    error: 'Бетті жүктеу мүмкін болмады',
    errorBody: 'Қайталап көріңіз. Қате қайталанса, басты бетке оралыңыз.',
    retry: 'Қайталап көру',
    home: 'Басты бетке',
    missing: 'Бет табылмады',
    missingBody: 'Мекенжай өзгерген болуы мүмкін. JETU басты бетіне оралыңыз.',
  },
  en: {
    title: 'Your next chapter has no borders.',
    description:
      'We’re building JETU for Central Asian students planning to study abroad and looking for funding.',
    status: 'Preparing to launch',
    note: 'Registration and the personal workspace are available. The program catalog is being populated with verified data.',
    belief: 'Big ambitions start with a clear path.',
    footer: 'International education. Closer to you.',
    language: 'Language',
    skip: 'Skip to content',
    loading: 'Loading page…',
    error: 'This page could not be loaded',
    errorBody: 'Try again. If the problem continues, return to the home page.',
    retry: 'Try again',
    home: 'Back to home',
    missing: 'Page not found',
    missingBody: 'The address may have changed. Return to the JETU home page.',
  },
} satisfies Record<Locale, Record<string, string>>;
