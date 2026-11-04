// Wizard questionnaire copy. Field labels keep coming from authCopy (personal
// fields), matchingCopy (readiness block) and searchCopy option names, exactly
// like the original page used them, so nothing drifts between flows.
import type { Locale } from '@/lib/i18n/messages';
import type { ErrorKey, StepId } from './steps';

export type OnboardingCopy = {
  progressLabel: string;
  stepNames: Record<StepId, string>;
  stepCaptions: Record<StepId, string>;
  next: string;
  stepBack: string;
  budgetHint: string;
  codeHint: string;
  yearHint: string;
  gpaHint: string;
  scoresHint: string;
  satHint: string;
  actHint: string;
  reviewTitle: string;
  reviewBody: string;
  editStep: string;
  emptyValue: string;
  budgetFormat: string;
  gpaFormat: string;
  errorTitle: string;
  errorKeys: Record<ErrorKey, string>;
  saving: string;
  savedTitle: string;
  savedBody: string;
  openMatching: string;
  openDashboard: string;
};

const enCopy: OnboardingCopy = {
  progressLabel: 'Step {n} of {m}: {name}',
  stepNames: {
    about: 'About you',
    background: 'Country & study',
    academics: 'GPA',
    scores: 'Exams',
    review: 'Check & save',
  },
  stepCaptions: {
    about: 'Where are you aiming, and what should matching serve?',
    background:
      'Everything is private — visible only to you and your matching.',
    academics: 'Optional: enter both fields together, or neither.',
    scores:
      'Skip what you have not taken. Scores stay self-reported until verified.',
    review: 'Check the answers and save. Reopen any step if something changed.',
  },
  next: 'Continue',
  stepBack: 'Back',
  budgetHint: 'Whole US dollars per year, tuition and living combined.',
  codeHint: 'Two-letter country code, for example KZ.',
  yearHint: '1950–2200, or leave empty.',
  gpaHint: 'Enter your GPA and its scale together, for example 3.8 of 4.0.',
  scoresHint: 'Leave empty if you have not taken it. Add only scores you know.',
  satHint: '400–1600.',
  actHint: '1–36.',
  reviewTitle: 'Check before saving',
  reviewBody:
    'Only you can see these details. They personalize matching and saved items.',
  editStep: 'Edit: {name}',
  emptyValue: 'Not provided',
  budgetFormat: '{value} USD per year',
  gpaFormat: '{value} of {scale}',
  errorTitle: 'Check the highlighted fields',
  errorKeys: {
    required: 'Fill in this field.',
    textShort: 'At least 2 characters.',
    textLong: 'This text is too long.',
    budget: 'Enter a whole number from 0 to 1,000,000.',
    code: 'Use a two-letter code like KZ.',
    year: 'Enter a year from 1950 to 2200, or leave empty.',
    gpaPair: 'Enter your GPA and its scale together.',
    gpaValue: 'GPA stays between 0 and 100.',
    gpaScale: 'The scale is a number from 0.1 to 100.',
    gpaLess: 'The GPA cannot exceed its scale.',
    scoreRange: 'This value is outside the valid range.',
  },
  saving: 'Saving…',
  savedTitle: 'Your profile is ready',
  savedBody:
    'Everything is stored privately. Matching now uses your real background.',
  openMatching: 'Open matching',
  openDashboard: 'Go to dashboard',
};

const ruCopy: OnboardingCopy = {
  progressLabel: 'Шаг {n} из {m}: {name}',
  stepNames: {
    about: 'О тебе',
    background: 'Гражданство и учёба',
    academics: 'Средний балл',
    scores: 'Экзамены',
    review: 'Проверка и сохранение',
  },
  stepCaptions: {
    about: 'Куда целишься и за что должен отвечать подбор?',
    background: 'Всё приватно: видно только тебе и твоему подбору.',
    academics: 'Необязательно: оба поля сразу или ни одного.',
    scores:
      'Не сдавал — оставь пустым. Данные считаются твоими, пока не подтвердим.',
    review: 'Проверь ответы и сохрани. Любой шаг можно открыть заново.',
  },
  next: 'Далее',
  stepBack: 'Назад',
  budgetHint: 'Целые доллары в год: обучение и жизнь вместе.',
  codeHint: 'Двухбуквенный код страны, например KZ.',
  yearHint: '1950–2200 или пусто.',
  gpaHint: 'Средний балл и его шкала вводятся вместе, например 3.8 из 4.0.',
  scoresHint: 'Не сдавал — оставь поле пустым. Пиши только то, что знаешь.',
  satHint: '400–1600.',
  actHint: '1–36.',
  reviewTitle: 'Проверь перед сохранением',
  reviewBody: 'Эти данные видны только тебе и делают подбор персональным.',
  editStep: 'Изменить: {name}',
  emptyValue: 'Не указано',
  budgetFormat: '{value} USD в год',
  gpaFormat: '{value} из {scale}',
  errorTitle: 'Проверь отмеченные поля',
  errorKeys: {
    required: 'Заполни это поле.',
    textShort: 'Минимум 2 символа.',
    textLong: 'Слишком длинно.',
    budget: 'Целое число от 0 до 1 000 000.',
    code: 'Двухбуквенный код, например KZ.',
    year: 'Год от 1950 до 2200 или пусто.',
    gpaPair: 'Средний балл и шкала вводятся вместе.',
    gpaValue: 'Балл в пределах от 0 до 100.',
    gpaScale: 'Шкала — число от 0.1 до 100.',
    gpaLess: 'Балл не может быть больше шкалы.',
    scoreRange: 'Значение вне допустимого диапазона.',
  },
  saving: 'Сохраняем…',
  savedTitle: 'Профиль готов!',
  savedBody:
    'Всё сохранено приватно. Подбор теперь работает с настоящими данными профиля.',
  openMatching: 'Перейти к подбору',
  openDashboard: 'В кабинет',
};

const kkCopy: OnboardingCopy = {
  progressLabel: '{m} қадамның {n}-шісі: {name}',
  stepNames: {
    about: 'Сіз туралы',
    background: 'Граждандық және оқу',
    academics: 'Орта бал',
    scores: 'Емтихандар',
    review: 'Тексеріп сақтау',
  },
  stepCaptions: {
    about: 'Қай жаққа бағытталадыңыз? Іріктеу сізге көмектесуі керек.',
    background: 'Барлығы жекелік: тек сіз және сіздің іріктеуіңіз көреді.',
    academics: 'Қалау бойынша: екі өрісті бірге немесе екеуін де жазбаңыз.',
    scores:
      'Тапсырмағаныңызды бос қалдырыңыз. Деректер расталмайынша — өзіңіз жазғаныңыз.',
    review:
      'Жауаптарды тексеріп сақтаңыз. Кез келген қадамды қайта аша аласыз.',
  },
  next: 'Әрі қарай',
  stepBack: 'Артқа',
  budgetHint: 'Жылына тұтас АҚШ доллары: оқу және тұрмыс бірге.',
  codeHint: 'Екі әріптен тұратын ел коды, мысалы KZ.',
  yearHint: '1950–2200 немесе бос қалдырыңыз.',
  gpaHint: 'Орта бал мен оның шкаласын бірге жазыңыз, мысалы 4.0 шкаладан 3.8.',
  scoresHint: 'Тапсырмаған болсаңыз бос қалдырыңыз. Білгеніңізді жазыңыз.',
  satHint: '400–1600.',
  actHint: '1–36.',
  reviewTitle: 'Сақтамас бұрын тексеріңіз',
  reviewBody: 'Бұл деректерді тек сіз көресіз. Олар іріктеуді жекелендіреді.',
  editStep: 'Өзгерту: {name}',
  emptyValue: 'Көрсетілмеген',
  budgetFormat: 'Жылына {value} USD',
  gpaFormat: '{scale} шкаладан {value}',
  errorTitle: 'Белгіленген өрістерді тексеріңіз',
  errorKeys: {
    required: 'Осы өрісті толтырыңыз.',
    textShort: 'Кемінде 2 таңба.',
    textLong: 'Тым ұзын.',
    budget: '0-ден 1 000 000-ға дейінгі тұтас сан.',
    code: 'Екі әріптен тұратын код жазыңыз, мысалы KZ.',
    year: '1950–2200 аралығындағы жыл немесе бос.',
    gpaPair: 'Орта бал мен шкаласын бірге жазыңыз.',
    gpaValue: 'Балл 0 мен 100 арасында болуы керек.',
    gpaScale: 'Шкала 0.1 мен 100 арасындағы сан.',
    gpaLess: 'Орта бал шкаладан аспайды.',
    scoreRange: 'Мән рұқсат етілген аралықтан тыс.',
  },
  saving: 'Сақтаудамыз…',
  savedTitle: 'Профиль дайын!',
  savedBody:
    'Барлығы жеке сақталды. Іріктеу енді нақты деректеріңізбен жұмыс істейді.',
  openMatching: 'Іріктеуге өту',
  openDashboard: 'Кабинетке қайту',
};

export const onboardingCopy = {
  en: enCopy,
  ru: ruCopy,
  kk: kkCopy,
} as const satisfies Record<Locale, OnboardingCopy>;

export function formatTemplate(
  template: string,
  pairs: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.hasOwn(pairs, key) ? pairs[key]! : match,
  );
}
