import type { Locale } from '@/lib/i18n/messages';

type Copy = {
  title: string;
  intro: string;
  denied: string;
  unavailable: string;
  retry: string;
  loading: string;
  record: string;
  claims: string;
  source: string;
  note: string;
  attest: string;
  publicationAttest: string;
  approve: string;
  reject: string;
  publish: string;
  unpublish: string;
  gates: string;
  saved: string;
  conflict: string;
  savedReload: string;
  empty: string;
  older: string;
  newer: string;
  newest: string;
  history: string;
  before: string;
  after: string;
  parents: string;
  noClaims: string;
  readOnly: string;
  missingRecord: string;
  role: string;
  pending: string;
};
export const editorCopy: Record<Locale, Copy> = {
  en: {
    title: 'Catalog review',
    intro:
      'Review the official evidence and the complete record before publication. Missing requirements and dates must remain unknown.',
    denied:
      'This account has no catalog review access. A platform administrator must grant membership.',
    unavailable: 'The review queue could not be loaded.',
    retry: 'Reload queue',
    loading: 'Loading review queue…',
    record: 'Record to review',
    claims: 'Source claims',
    source: 'Open official source',
    note: 'Review note (10–1000 characters)',
    attest:
      'I checked this exact claim against the official source and recorded my reason.',
    publicationAttest:
      'I reviewed all displayed record fields and their evidence. Missing facts remain unknown; publication does not confirm applicant eligibility or an open cycle.',
    approve: 'Approve this claim',
    reject: 'Reject this claim',
    publish: 'Publish reviewed record',
    unpublish: 'Withdraw publication',
    gates:
      'Resolve pending or conflicting claims and review parent records first. Published dependents must be withdrawn before their parent.',
    saved: 'Review saved.',
    conflict: 'The record changed. Reload and review the latest version.',
    savedReload:
      'The change was saved, but refreshing failed. Reload before another action.',
    empty: 'No records on this page.',
    older: 'Older records',
    newer: 'Previous page',
    newest: 'Newest records',
    history: 'Recent audit history',
    before: 'Before',
    after: 'After',
    parents: 'Parent records',
    noClaims: 'No source claims: publication is unavailable.',
    readOnly:
      'Read-only editorial access. Reviewing and publishing require reviewer membership.',
    missingRecord: 'This entity type is not supported by this review screen.',
    role: 'Access role',
    pending: 'Saving…',
  },
  ru: {
    title: 'Проверка каталога',
    intro:
      'Перед публикацией проверьте официальный источник и всю запись. Отсутствующие требования и даты должны оставаться неизвестными.',
    denied:
      'У этого аккаунта нет доступа к проверке каталога. Администратор платформы должен выдать роль.',
    unavailable: 'Не удалось загрузить очередь проверки.',
    retry: 'Обновить очередь',
    loading: 'Загрузка очереди…',
    record: 'Запись для проверки',
    claims: 'Утверждения источника',
    source: 'Открыть официальный источник',
    note: 'Комментарий проверки (10–1000 символов)',
    attest:
      'Я сверил именно это утверждение с официальным источником и записал обоснование.',
    publicationAttest:
      'Я проверил все показанные поля и их источники. Отсутствующие факты остаются неизвестными; публикация не подтверждает соответствие абитуриента или открытый набор.',
    approve: 'Подтвердить утверждение',
    reject: 'Отклонить утверждение',
    publish: 'Опубликовать проверенную запись',
    unpublish: 'Снять с публикации',
    gates:
      'Сначала разрешите непроверенные или противоречивые утверждения и проверьте родительские записи. Зависимые публикации нужно снять раньше родительской.',
    saved: 'Проверка сохранена.',
    conflict: 'Запись изменилась. Обновите очередь и проверьте новую версию.',
    savedReload:
      'Изменение сохранено, но обновление не удалось. Перезагрузите очередь перед следующим действием.',
    empty: 'На этой странице нет записей.',
    older: 'Более ранние записи',
    newer: 'Предыдущая страница',
    newest: 'Новые записи',
    history: 'Последние действия',
    before: 'До',
    after: 'После',
    parents: 'Родительские записи',
    noClaims: 'Нет утверждений из источников: публикация недоступна.',
    readOnly:
      'Доступ только для чтения. Для проверки и публикации нужна роль reviewer.',
    missingRecord: 'Этот тип записи не поддерживается на экране проверки.',
    role: 'Роль доступа',
    pending: 'Сохранение…',
  },
  kk: {
    title: 'Каталогты тексеру',
    intro:
      'Жарияламас бұрын ресми дереккөз бен бүкіл жазбаны тексеріңіз. Жоқ талаптар мен күндер белгісіз болып қалуы керек.',
    denied:
      'Бұл аккаунтқа каталогты тексеруге рұқсат берілмеген. Платформа әкімшісі рөл беруі керек.',
    unavailable: 'Тексеру кезегі жүктелмеді.',
    retry: 'Кезекті жаңарту',
    loading: 'Кезек жүктелуде…',
    record: 'Тексерілетін жазба',
    claims: 'Дереккөз мәлімдемелері',
    source: 'Ресми дереккөзді ашу',
    note: 'Тексеру пікірі (10–1000 таңба)',
    attest: 'Осы мәлімдемені ресми дереккөзбен салыстырып, себебін жаздым.',
    publicationAttest:
      'Көрсетілген барлық өрістер мен дәлелдерді тексердім. Жоқ деректер белгісіз қалады; жариялау талапкердің сәйкестігін немесе қабылдаудың ашық екенін растамайды.',
    approve: 'Мәлімдемені растау',
    reject: 'Мәлімдемені қабылдамау',
    publish: 'Тексерілген жазбаны жариялау',
    unpublish: 'Жариялаудан алу',
    gates:
      'Алдымен тексерілмеген не қайшы мәлімдемелерді шешіп, ата-аналық жазбаларды тексеріңіз. Тәуелді жарияланымдарды ата-аналық жазбадан бұрын алып тастаңыз.',
    saved: 'Тексеру сақталды.',
    conflict: 'Жазба өзгерді. Кезекті жаңартып, соңғы нұсқасын тексеріңіз.',
    savedReload:
      'Өзгеріс сақталды, бірақ жаңарту орындалмады. Келесі әрекет алдында кезекті қайта жүктеңіз.',
    empty: 'Бұл бетте жазбалар жоқ.',
    older: 'Бұрынғы жазбалар',
    newer: 'Алдыңғы бет',
    newest: 'Жаңа жазбалар',
    history: 'Соңғы әрекеттер',
    before: 'Бұрын',
    after: 'Кейін',
    parents: 'Ата-аналық жазбалар',
    noClaims: 'Дереккөз мәлімдемелері жоқ: жариялау қолжетімсіз.',
    readOnly:
      'Тек оқу рұқсаты. Тексеру және жариялау үшін reviewer рөлі қажет.',
    missingRecord: 'Бұл жазба түрі тексеру экранында қолдау таппайды.',
    role: 'Рұқсат рөлі',
    pending: 'Сақталуда…',
  },
};
