import type { Locale } from '@/lib/i18n/messages';

export const matchingCopy: Record<
  Locale,
  {
    title: string;
    intro: string;
    readiness: string;
    missing: string;
    preferences: string;
    countries: string;
    majors: string;
    levels: string;
    languages: string;
    funding: string;
    year: string;
    term: string;
    run: string;
    running: string;
    results: string;
    empty: string;
    error: string;
    retry: string;
    score: string;
    assessed: string;
    scoreNote: string;
    met: string;
    unmet: string;
    unknown: string;
    source: string;
    eligible: string;
    potentially_eligible: string;
    not_eligible: string;
    insufficient_information: string;
    program: string;
    scholarship: string;
    deadline: string;
    coverage: string;
    compare: string;
    save: string;
    updateProfile: string;
    details: string;
    noDecision: string;
    recent: string;
    nationality: string;
    residency: string;
    educationLevel: string;
    graduationYear: string;
    gpa: string;
    gpaScale: string;
    testScores: string;
    rateLimited: string;
    secondary: string;
    other: string;
    verification: {
      verified: string;
      unverified: string;
      stale: string;
      conflicted: string;
    };
  }
> = {
  en: {
    title: 'Find your fit',
    intro:
      'Compare verified catalog facts with your private profile. Results are guidance, not admissions decisions.',
    readiness: 'Profile readiness',
    missing: 'Missing information',
    preferences: 'Your preferences',
    countries: 'Preferred countries (2-letter codes, comma separated)',
    majors: 'Fields of study (comma separated)',
    levels: 'Degree levels',
    languages: 'Teaching languages (codes, comma separated)',
    funding: 'I need funding',
    year: 'Enrollment year',
    term: 'Enrollment term',
    run: 'Run matching',
    running: 'Checking published opportunities…',
    results: 'Recommendations',
    empty:
      'No published programs or scholarships were found. Check the catalog later or change preferences.',
    error: 'Matching is unavailable. Check your profile and try again.',
    retry: 'Try again',
    score: 'Preference fit',
    assessed: 'Known factors',
    scoreNote:
      'Earned points out of 100; known factors shows how many points could be assessed. This is not an admission probability.',
    met: 'Met',
    unmet: 'Unmet',
    unknown: 'Unknown or needs review',
    source: 'Official source',
    eligible: 'Eligible on known rules',
    potentially_eligible: 'Potentially eligible',
    not_eligible: 'Known requirement unmet',
    insufficient_information: 'Insufficient information',
    program: 'Program',
    scholarship: 'Scholarship',
    deadline: 'Deadline',
    coverage: 'Verified listed coverage',
    compare: 'Compare programs',
    save: 'Save program',
    updateProfile: 'Update profile',
    details: 'Open details',
    noDecision: 'JETU does not make an official admissions decision.',
    recent: 'Last saved run',
    nationality: 'Nationality (2-letter code)',
    residency: 'Residency (2-letter code)',
    educationLevel: 'Completed education level',
    graduationYear: 'Graduation year',
    gpa: 'GPA',
    gpaScale: 'GPA scale',
    testScores: 'Test scores (self-reported until verified)',
    rateLimited: 'Please wait before running matching again.',
    secondary: 'Secondary school',
    other: 'Other',
    verification: {
      verified: 'verified',
      unverified: 'unverified',
      stale: 'stale',
      conflicted: 'conflicting sources',
    },
  },
  ru: {
    title: 'Подбор программ',
    intro:
      'Сопоставьте опубликованные факты с вашей личной анкетой. Результат не является решением университета.',
    readiness: 'Готовность анкеты',
    missing: 'Не хватает данных',
    preferences: 'Ваши предпочтения',
    countries: 'Предпочитаемые страны (двухбуквенные коды через запятую)',
    majors: 'Направления (через запятую)',
    levels: 'Уровни обучения',
    languages: 'Языки обучения (коды через запятую)',
    funding: 'Нужна финансовая поддержка',
    year: 'Год поступления',
    term: 'Семестр поступления',
    run: 'Запустить подбор',
    running: 'Проверяем опубликованные варианты…',
    results: 'Рекомендации',
    empty:
      'Опубликованные программы и стипендии не найдены. Проверьте каталог позже или измените предпочтения.',
    error: 'Подбор недоступен. Проверьте анкету и повторите попытку.',
    retry: 'Повторить',
    score: 'Соответствие предпочтениям',
    assessed: 'Известные факторы',
    scoreNote:
      'Набранные баллы из 100; известные факторы показывают, сколько баллов удалось оценить. Это не вероятность поступления.',
    met: 'Соответствует',
    unmet: 'Не соответствует',
    unknown: 'Неизвестно или нужна проверка',
    source: 'Официальный источник',
    eligible: 'Подходит по известным условиям',
    potentially_eligible: 'Возможно подходит',
    not_eligible: 'Известное условие не выполнено',
    insufficient_information: 'Недостаточно данных',
    program: 'Программа',
    scholarship: 'Стипендия',
    deadline: 'Срок подачи',
    coverage: 'Подтверждённое покрытие',
    compare: 'Сравнить программы',
    save: 'Сохранить программу',
    updateProfile: 'Обновить анкету',
    details: 'Подробнее',
    noDecision: 'JETU не принимает официальных решений о поступлении.',
    recent: 'Последний сохранённый подбор',
    nationality: 'Гражданство (двухбуквенный код)',
    residency: 'Резидентство (двухбуквенный код)',
    educationLevel: 'Завершённый уровень образования',
    graduationYear: 'Год окончания',
    gpa: 'Средний балл',
    gpaScale: 'Шкала среднего балла',
    testScores: 'Баллы тестов (со слов студента до проверки)',
    rateLimited: 'Подождите перед повторным запуском подбора.',
    secondary: 'Средняя школа',
    other: 'Другое',
    verification: {
      verified: 'проверено',
      unverified: 'не проверено',
      stale: 'устарело',
      conflicted: 'источники противоречат',
    },
  },
  kk: {
    title: 'Сәйкес бағдарламалар',
    intro:
      'Жарияланған деректерді жеке сауалнамаңызбен салыстырыңыз. Бұл университеттің ресми шешімі емес.',
    readiness: 'Сауалнама дайындығы',
    missing: 'Жетіспейтін деректер',
    preferences: 'Қалауларыңыз',
    countries: 'Қалаулы елдер (екі әріптік кодтар, үтірмен)',
    majors: 'Оқу бағыттары (үтірмен)',
    levels: 'Оқу деңгейлері',
    languages: 'Оқыту тілдері (кодтар, үтірмен)',
    funding: 'Қаржылық қолдау қажет',
    year: 'Түсу жылы',
    term: 'Түсу мерзімі',
    run: 'Іріктеуді бастау',
    running: 'Жарияланған мүмкіндіктер тексерілуде…',
    results: 'Ұсынымдар',
    empty:
      'Жарияланған бағдарламалар мен стипендиялар табылмады. Каталогты кейін тексеріңіз немесе қалауды өзгертіңіз.',
    error: 'Іріктеу қолжетімсіз. Сауалнаманы тексеріп, қайталаңыз.',
    retry: 'Қайталау',
    score: 'Қалауға сәйкестік',
    assessed: 'Белгілі факторлар',
    scoreNote:
      '100 ұпайдың ішінен жиналған ұпай; белгілі факторлар қанша ұпайды бағалауға болғанын көрсетеді. Бұл оқуға түсу ықтималдығы емес.',
    met: 'Сәйкес',
    unmet: 'Сәйкес емес',
    unknown: 'Белгісіз немесе тексеру қажет',
    source: 'Ресми дереккөз',
    eligible: 'Белгілі шарттар бойынша сәйкес',
    potentially_eligible: 'Сәйкес болуы мүмкін',
    not_eligible: 'Белгілі шарт орындалмады',
    insufficient_information: 'Дерек жеткіліксіз',
    program: 'Бағдарлама',
    scholarship: 'Стипендия',
    deadline: 'Өтініш мерзімі',
    coverage: 'Расталған қамту',
    compare: 'Бағдарламаларды салыстыру',
    save: 'Бағдарламаны сақтау',
    updateProfile: 'Сауалнаманы жаңарту',
    details: 'Толығырақ',
    noDecision: 'JETU оқуға түсу туралы ресми шешім қабылдамайды.',
    recent: 'Соңғы сақталған іріктеу',
    nationality: 'Азаматтық (екі әріптік код)',
    residency: 'Тұру мәртебесі (екі әріптік код)',
    educationLevel: 'Аяқталған білім деңгейі',
    graduationYear: 'Бітіру жылы',
    gpa: 'Орташа балл',
    gpaScale: 'Орташа балл шкаласы',
    testScores: 'Тест балдары (тексерілгенге дейін студент мәлімдеген)',
    rateLimited: 'Іріктеуді қайта бастамас бұрын күтіңіз.',
    secondary: 'Орта мектеп',
    other: 'Басқа',
    verification: {
      verified: 'тексерілген',
      unverified: 'тексерілмеген',
      stale: 'ескірген',
      conflicted: 'дереккөздер қайшы',
    },
  },
};
