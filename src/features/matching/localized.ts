import type { Locale } from '@/lib/i18n/messages';
import type { RuleResult, RuleStatus } from './engine';

type Phrases = Record<string, Partial<Record<RuleStatus, string>>>;
const translations: Record<'ru' | 'kk', Phrases> = {
  ru: {
    deadline: {
      MET: 'Срок подачи ещё не прошёл.',
      NOT_MET: 'Указанный срок подачи прошёл.',
      UNKNOWN: 'Срок подачи или его источник требует проверки.',
    },
    requirements: {
      UNKNOWN: 'Подтверждённых структурированных условий пока нет.',
    },
    citizenship: {
      MET: 'Гражданство соответствует условию.',
      NOT_MET: 'Гражданство не соответствует условию.',
      UNKNOWN: 'Гражданство или источник условия требует проверки.',
    },
    residency: {
      MET: 'Статус проживания соответствует условию.',
      NOT_MET: 'Статус проживания не соответствует условию.',
      UNKNOWN: 'Статус проживания или источник условия требует проверки.',
    },
    test: {
      MET: 'Проверенный балл соответствует указанному порогу.',
      NOT_MET: 'Балла недостаточно или срок его действия истёк.',
      UNKNOWN:
        'Балл, его проверка или правила альтернативных тестов требуют уточнения.',
    },
    gpa: {
      MET: 'Средний балл соответствует порогу.',
      NOT_MET: 'Средний балл ниже порога.',
      UNKNOWN: 'Шкалу или средний балл нельзя надёжно сопоставить.',
    },
    degree: {
      MET: 'Предыдущее образование соответствует условию.',
      NOT_MET: 'Предыдущее образование не соответствует условию.',
      UNKNOWN: 'Предыдущее образование требует проверки.',
    },
    link: {
      UNKNOWN:
        'Связь с программой не подтверждает личное соответствие условиям стипендии.',
    },
    funding: { UNKNOWN: 'Состав покрытия не подтверждён.' },
    review: { UNKNOWN: 'Это условие требует ручной проверки.' },
  },
  kk: {
    deadline: {
      MET: 'Өтініш мерзімі әлі аяқталмаған.',
      NOT_MET: 'Көрсетілген өтініш мерзімі аяқталған.',
      UNKNOWN: 'Мерзімді немесе оның дереккөзін тексеру қажет.',
    },
    requirements: { UNKNOWN: 'Расталған құрылымдалған талаптар әзірше жоқ.' },
    citizenship: {
      MET: 'Азаматтық шартқа сай.',
      NOT_MET: 'Азаматтық шартқа сай емес.',
      UNKNOWN: 'Азаматтықты немесе шарт дереккөзін тексеру қажет.',
    },
    residency: {
      MET: 'Тұру мәртебесі шартқа сай.',
      NOT_MET: 'Тұру мәртебесі шартқа сай емес.',
      UNKNOWN: 'Тұру мәртебесін немесе шарт дереккөзін тексеру қажет.',
    },
    test: {
      MET: 'Тексерілген балл көрсетілген шекке сай.',
      NOT_MET: 'Балл жеткіліксіз немесе жарамдылық мерзімі аяқталған.',
      UNKNOWN:
        'Баллды, оны растауды немесе балама тест ережесін анықтау қажет.',
    },
    gpa: {
      MET: 'Орташа балл шекке сай.',
      NOT_MET: 'Орташа балл шектен төмен.',
      UNKNOWN: 'Балл мен шкаланы сенімді салыстыру мүмкін емес.',
    },
    degree: {
      MET: 'Алдыңғы білім деңгейі шартқа сай.',
      NOT_MET: 'Алдыңғы білім деңгейі шартқа сай емес.',
      UNKNOWN: 'Алдыңғы білім деңгейін тексеру қажет.',
    },
    link: {
      UNKNOWN:
        'Бағдарлама байланысы студенттің стипендия шарттарына сәйкестігін дәлелдемейді.',
    },
    funding: { UNKNOWN: 'Қамту құрамдастары расталмаған.' },
    review: { UNKNOWN: 'Бұл шартты қолмен тексеру қажет.' },
  },
};

export function localizedRule(locale: Locale, rule: RuleResult) {
  if (locale === 'en') return rule.explanation;
  const key =
    rule.id === 'deadline'
      ? 'deadline'
      : rule.id === 'requirements_coverage'
        ? 'requirements'
        : rule.id === 'scholarship_program_link'
          ? 'link'
          : rule.id === 'funding_coverage'
            ? 'funding'
            : rule.id.includes(':test:')
              ? 'test'
              : rule.id.endsWith(':citizenship')
                ? 'citizenship'
                : rule.id.endsWith(':residency')
                  ? 'residency'
                  : rule.id.endsWith(':gpa')
                    ? 'gpa'
                    : rule.id.endsWith(':prior_degree')
                      ? 'degree'
                      : 'review';
  return (
    translations[locale][key]?.[rule.status] ??
    translations[locale].review?.UNKNOWN ??
    ''
  );
}

const reasons: Record<Locale, Record<string, string>> = {
  en: {},
  ru: {
    'Preferred field matches.': 'Совпадает предпочтительное направление.',
    'Preferred country matches.': 'Совпадает предпочтительная страна.',
    'Preferred teaching language matches.':
      'Совпадает предпочтительный язык обучения.',
    'Preferred degree level matches.':
      'Совпадает предпочтительный уровень обучения.',
    'Source-backed tuition funding is listed.':
      'Указана подтверждённая источником оплата обучения.',
  },
  kk: {
    'Preferred field matches.': 'Қалаулы оқу бағыты сәйкес.',
    'Preferred country matches.': 'Қалаулы ел сәйкес.',
    'Preferred teaching language matches.': 'Қалаулы оқыту тілі сәйкес.',
    'Preferred degree level matches.': 'Қалаулы оқу деңгейі сәйкес.',
    'Source-backed tuition funding is listed.':
      'Дереккөзбен расталған оқу ақысы көрсетілген.',
  },
};
export const localizedReason = (locale: Locale, reason: string) =>
  reasons[locale][reason] ?? reason;
