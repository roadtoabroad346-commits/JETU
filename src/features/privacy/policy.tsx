import type { Locale } from '@/lib/i18n/messages';
import { MarketingFooter } from '@/components/marketing/footer';
import { marketing } from '@/lib/i18n/marketing';

const policies = {
  ru: {
    intro:
      'Какие данные нужны JETU, как они используются и как ты можешь ими управлять. Редакция от 4 ноября 2026 года.',
    contact: 'Связаться по вопросам данных',
    contents: 'В этой политике',
    summaries: [
      [
        'Твой профиль — личный',
        'Данные анкеты, сохранённые варианты и результаты подбора привязаны к твоему аккаунту.',
      ],
      [
        'Ты выбираешь, чем делиться',
        'Баллы, экзамены и бюджет можно не указывать. Документы на этом этапе не запрашиваются.',
      ],
      [
        'Есть понятный контакт',
        'Запросить доступ, исправление или удаление данных можно по электронной почте владельца.',
      ],
    ],
    sections: [
      [
        'Кто отвечает за данные',
        'Владелец и контактное лицо сервиса JETU — Мырзабек Нұржан, Казахстан. По вопросам обработки персональных данных: jetuu1550@gmail.com. Политика распространяется на сайт JETU и его личный кабинет. Она описывает текущую версию сервиса, а не будущие функции.',
      ],
      [
        'Какие данные обрабатываются',
        'Для аккаунта: имя, электронная почта, данные авторизации, язык интерфейса, версия и дата принятия политики, декларация возраста или согласия законного представителя. Для профиля: страна проживания, класс или этап обучения, выбранная степень и направление. По желанию — гражданство, резидентство, завершённое образование, год выпуска, средний балл и шкала, экзамены и бюджет. Также сохраняются история версий профиля, выбранные программы, заметки, сохранённые поиски, предпочтения и результаты подбора. Не указывай паспортные, платёжные, медицинские данные и чужие сведения в свободных полях.',
      ],
      [
        'Для чего используются данные',
        'Для создания и защиты аккаунта, входа и восстановления доступа, сохранения профиля, поиска, личных списков, сравнения и объяснимого подбора. Класс помогает понять этап подготовки; он не подтверждает возраст, гражданство или завершение образования. Пользовательские баллы не становятся подтверждёнными результатами. Обязательные поля отмечены в интерфейсе; остальные можно пропустить без выдуманных значений.',
      ],
      [
        'Согласие и правовые основания',
        'Регистрация требует отдельного активного подтверждения ознакомления с этой политикой и принятия условий. Согласие не отмечено заранее; версия политики и время подтверждения записываются при регистрации. Обработка нужна для запрошенных функций сервиса; техническая защита и исполнение обязательных требований осуществляются в пределах применимого законодательства. Согласие на рекламу не включено в регистрацию. Редактирование профиля не создаёт новое согласие автоматически. Для отзыва согласия напиши владельцу; если без данных невозможно предоставить функцию, её использование будет прекращено.',
      ],
      [
        'Ученики и несовершеннолетние',
        'При регистрации пользователь подтверждает, что ему исполнилось 16 лет либо получено согласие родителя или законного представителя, требуемое применимым правом. Отметка в форме — декларация, а не проверка возраста или полномочий представителя. Законный представитель может обратиться к владельцу по вопросам доступа и удаления. Для подтверждения запроса сначала используется почта аккаунта; не отправляй копии паспорта без обоснованного отдельного запроса. При необходимости согласия, которого нет, аккаунт создавать не следует.',
      ],
      [
        'Кто помогает предоставлять сервис',
        'Supabase используется для авторизации, базы данных и хранения пользовательских записей; Vercel — для размещения приложения в текущей инфраструктуре. Эти поставщики могут обрабатывать технические данные в рамках предоставления своих услуг. Доступ команды ограничивается задачами сопровождения и обработки обращений. Профиль не публикуется в каталоге и не передаётся университетам или менторам автоматически. В текущей реализации нет отправки профиля внешнему AI-провайдеру, рекламных пикселей и платёжного процессинга.',
      ],
      [
        'Размещение и международная обработка',
        'Инфраструктура поставщиков может находиться за пределами Казахстана. Передача данных при использовании облачных функций может быть трансграничной. Конкретные места хранения, условия поставщиков и применимые требования локализации проверяются владельцем перед публичным запуском и изменением инфраструктуры. Текущая политика не обещает хранение исключительно в Казахстане. Если требуется уточнение места обработки конкретных данных, обратись к владельцу до регистрации.',
      ],
      [
        'Cookies и память браузера',
        'Для входа используются необходимые cookies сессии. Сервер проверяет авторизацию, а правила доступа в базе ограничивают чтение и изменение личных записей владельцем аккаунта. Пароль не сохраняется в черновик браузера или поля профиля. Ответы пошагового заполнения находятся в памяти открытой вкладки до сохранения: обновление может потерять несохранённые изменения. Необязательная аналитика и рекламные cookies в этой версии не подключены. Блокировка необходимых cookies может нарушить вход.',
      ],
      [
        'Как долго хранятся данные',
        'Аккаунт, профиль, его история, личные списки и подборы хранятся, пока нужны для предоставления функций и до исполнения подтверждённого запроса на удаление, с учётом обязательного хранения по закону. Самостоятельное изменение поля не удаляет старые версии профиля. Технические журналы и резервные копии имеют отдельные настройки провайдеров; единый срок их очистки сейчас не подтверждён. Автоматическое удаление по фиксированному сроку не обещается. Актуальные сроки и ограничения удаления можно запросить у владельца.',
      ],
      [
        'Твои права и порядок обращения',
        'Можно запросить сведения об обработке, копию данных, исправление, удаление, отзыв согласия и рассмотрение возражений в пределах применимого права. Для обращения напиши на jetuu1550@gmail.com с темой «JETU — персональные данные», укажи почту аккаунта и нужное действие. Не включай пароль и лишние документы. Для защиты от удаления чужого аккаунта потребуется соразмерное подтверждение принадлежности. Обращения обрабатываются вручную в применимые законодательные сроки; возможные ограничения и необходимость сохранения отдельных данных будут объяснены в ответе.',
      ],
      [
        'Что можно сделать самостоятельно',
        'Проверить и изменить профиль в личном кабинете, скачать JSON-копию ответов на этапе проверки, изменить личные списки и заметки, восстановить пароль и выйти из сессий. Скачанный файл хранится там, куда его сохранил пользователь: позаботься о нём на общих устройствах. Кнопка удаления аккаунта в текущей версии не реализована — для удаления нужен запрос владельцу, включая профиль, историю, списки и подборы.',
      ],
      [
        'Защита и ограничения',
        'Приложение использует серверную проверку личности и разграничение доступа к личным записям, проверяет ввод и версии сохраняемого профиля. При ошибке сохранения интерфейс не должен сообщать об успехе. Не существует гарантии абсолютной безопасности: при подозрении на посторонний доступ смени пароль и напиши владельцу. Ошибки, инциденты и запросы рассматриваются с учётом применимых требований уведомления.',
      ],
      [
        'Подбор и автоматическая обработка',
        'Подбор сопоставляет данные профиля с опубликованными условиями и отдельно считает соответствие предпочтениям. Результаты не являются решением университета, оценкой личности, вероятностью поступления или гарантией стипендии. Неизвестные сведения должны оставаться неизвестными. Перед подачей сверяй требования и сроки с официальным источником; ошибка или устаревшие данные могут повлиять на результат.',
      ],
      [
        'Изменения политики',
        'Актуальная редакция публикуется на этой странице с датой. При существенном изменении целей или состава обработки потребуется соответствующее уведомление и, когда необходимо, новое согласие до новой обработки. Условия сторонних сайтов регулируются их собственными политиками. Ссылки на такие сайты не дают им доступ к личному профилю JETU автоматически.',
      ],
    ],
  },
  en: {
    intro:
      'What JETU needs, how your information is used, and how you stay in control. Version dated November 4, 2026.',
    contact: 'Contact about personal data',
    contents: 'In this policy',
    summaries: [
      [
        'Your profile is private',
        'Profile answers, saved items and matching runs belong to your account.',
      ],
      [
        'You choose what to share',
        'Grades, exams and budget are optional. Documents are not requested at this stage.',
      ],
      [
        'A clear contact',
        'Request access, correction or deletion by emailing the owner.',
      ],
    ],
    sections: [
      [
        'Who is responsible',
        'The owner and contact for JETU is Мырзабек Нұржан, Kazakhstan. Contact for personal data: jetuu1550@gmail.com. This policy covers the JETU website and account workspace. It describes the current service rather than planned features.',
      ],
      [
        'Information we process',
        'Account information: name, email, authentication information, interface language, policy version and acceptance time, and the age or guardian-consent declaration. Profile information: country of residence, school grade or stage, intended degree and field. Optional information includes citizenship, residency, completed education, graduation year, average grade and scale, exam scores and tuition budget. We also store profile version history, saved programs, notes, saved searches, preferences and matching runs. Do not put passport, payment, medical or other people’s information into free-text fields.',
      ],
      [
        'Why information is used',
        'To create and protect accounts, sign in, recover access, store profiles and provide search, saved lists, comparison and explainable matching. School stage is context, not proof of age, citizenship or completed education. Self-reported scores do not become verified scores. Required fields are identified in the interface; optional fields may remain blank.',
      ],
      [
        'Consent and legal grounds',
        'Registration requires active acceptance of the terms and acknowledgement of this policy. Consent is not preselected; its version and acceptance time are recorded on registration. Processing serves requested account features; technical protection and mandatory obligations are handled within applicable law. Registration does not include advertising consent. Editing a profile does not silently manufacture new consent. To withdraw consent, contact the owner; features that require the information may then cease.',
      ],
      [
        'Students and minors',
        'Registration requires a declaration that the user is at least 16 or has the parent or legal guardian consent required under applicable law. A checkbox is a declaration, not verification of age or a guardian’s authority. A legal guardian may contact the owner about access and deletion. Account email is used first to confirm a request; do not send passport copies without a separate, justified request. Do not create an account if required consent is absent.',
      ],
      [
        'Service providers and recipients',
        'Supabase provides authentication, the database and user record storage; Vercel hosts the application in the current infrastructure. Providers may process technical information to supply their services. Team access is limited to maintenance and handling requests. Your profile is not published in the catalog or automatically sent to universities or mentors. The current implementation does not send profiles to an external AI provider or include advertising pixels or payment processing.',
      ],
      [
        'Location and international processing',
        'Provider infrastructure may be outside Kazakhstan, and cloud use may involve international data transfers. The owner must confirm actual storage locations, provider terms and applicable localization requirements before a public launch or infrastructure change. This policy does not promise Kazakhstan-only storage. Ask the owner before registering if you need details about the processing location of specific data.',
      ],
      [
        'Cookies and browser memory',
        'Necessary session cookies support sign-in. Server identity checks and database access rules restrict private record access to the account owner. Passwords are not stored in browser drafts or profile fields. Unsaved onboarding answers remain in the open tab’s memory; refreshing may lose changes. Optional analytics and advertising cookies are not connected in this version. Blocking necessary cookies may prevent sign-in.',
      ],
      [
        'Retention',
        'Accounts, profiles, version history, lists and matching runs are retained while needed for requested features and until a verified deletion request is fulfilled, subject to mandatory legal retention. Editing a field does not remove earlier profile versions. Technical logs and backups use separate provider settings; a single confirmed cleanup period is not currently established. Automatic deletion after a fixed period is not promised. Ask the owner for current retention settings and deletion limitations.',
      ],
      [
        'Your rights and how to request them',
        'Within applicable law, you may request processing information, a copy, correction, deletion, consent withdrawal and consideration of objections. Email jetuu1550@gmail.com with the subject “JETU — personal data”, your account email and requested action. Do not include passwords or unnecessary documents. Proportionate account ownership verification protects against another person deleting your account. Requests are handled manually within applicable statutory periods; any restrictions or mandatory retention will be explained.',
      ],
      [
        'Controls available to you',
        'Review and edit your profile, download a JSON copy of answers at the review step, change personal lists and notes, reset your password and sign out of sessions. You control downloaded copies; protect them on shared devices. An account-deletion button is not implemented in this version. Ask the owner to delete the account, profile, history, saved items and matching runs.',
      ],
      [
        'Protection and limitations',
        'The application checks identity on the server, restricts private records, validates input and checks profile versions during saves. Failed saves must not display success. Absolute security cannot be guaranteed. If you suspect unauthorized access, change your password and contact the owner. Incidents and requests are handled under applicable notification requirements.',
      ],
      [
        'Matching and automated processing',
        'Matching compares your profile with published requirements and separately scores preferences. It is not a university decision, a judgement of a person, an admission probability or a scholarship guarantee. Missing facts should remain unknown. Verify requirements and deadlines with official sources before applying; errors or outdated information may affect results.',
      ],
      [
        'Policy changes',
        'The current version is published here with its date. Material changes to processing purposes or categories require appropriate notice and, where necessary, fresh consent before the new processing. External websites have their own policies. A link to an external website does not automatically grant it access to your JETU profile.',
      ],
    ],
  },
  kk: {
    intro:
      'JETU-ға қандай деректер қажет, олар қалай қолданылады және оларды қалай басқара аласың. 2026 жылғы 4 қарашадағы нұсқа.',
    contact: 'Дербес деректер бойынша байланыс',
    contents: 'Осы саясатта',
    summaries: [
      [
        'Профилің — жеке',
        'Сауалнама, сақталған нұсқалар және іріктеу нәтижелері аккаунтыңа тиесілі.',
      ],
      [
        'Не бөлісетініңді өзің шешесің',
        'Бағалар, емтихандар және бюджет міндетті емес. Бұл кезеңде құжаттар сұралмайды.',
      ],
      [
        'Байланыс түсінікті',
        'Деректерге қол жеткізу, түзету немесе жою үшін иесіне хат жазуға болады.',
      ],
    ],
    sections: [
      [
        'Деректерге кім жауапты',
        'JETU сервисінің иесі және байланыс тұлғасы — Мырзабек Нұржан, Қазақстан. Дербес деректер бойынша: jetuu1550@gmail.com. Саясат JETU сайты мен жеке кабинетіне қолданылады. Мұнда жоспарланған емес, қазіргі функциялар сипатталған.',
      ],
      [
        'Қандай деректер өңделеді',
        'Аккаунт үшін: аты, электрондық пошта, авторизация деректері, интерфейс тілі, саясат нұсқасы мен қабылдау уақыты, жас немесе заңды өкілдің келісімі туралы мәлімдеме. Профиль үшін: тұратын ел, сынып не оқу кезеңі, жоспарланған білім деңгейі мен бағыты. Қалауың бойынша азаматтық, резиденттік, аяқталған білім, бітіру жылы, орташа балл мен шкала, емтихан нәтижелері және бюджет. Профиль нұсқаларының тарихы, сақталған бағдарламалар, жазбалар, іздеулер, қалаулар мен іріктеулер де сақталады. Еркін өрістерге паспорт, төлем, медициналық немесе басқа адамдардың деректерін жазба.',
      ],
      [
        'Деректер не үшін қажет',
        'Аккаунт жасау және қорғау, кіру, қолжетімділікті қалпына келтіру, профильді сақтау, іздеу, жеке тізімдер, салыстыру және түсіндірілетін іріктеу үшін. Сынып дайындық кезеңін түсінуге көмектеседі, бірақ жасты, азаматтықты не білім аяқталғанын растамайды. Студент көрсеткен балдар автоматты түрде расталған болмайды. Міндетті өрістер интерфейсте белгіленеді, қалғандарын бос қалдыруға болады.',
      ],
      [
        'Келісім және құқықтық негіздер',
        'Тіркелу үшін шарттарды белсенді қабылдап, осы саясатпен танысқаныңды растау қажет. Келісім алдын ала белгіленбейді; нұсқасы мен қабылдау уақыты тіркелуде жазылады. Деректер сұралған функцияларды беру үшін, ал техникалық қорғау мен міндетті талаптар қолданылатын заң шегінде өңделеді. Тіркелуге жарнама келісімі кірмейді. Профильді өңдеу жаңа келісімді автоматты түрде жасамайды. Келісімді қайтарып алу үшін иесіне жаз; деректер қажет функциялар тоқтатылуы мүмкін.',
      ],
      [
        'Оқушылар және кәмелетке толмағандар',
        'Тіркелгенде қолданушы 16 жасқа толғанын немесе қолданылатын құқыққа сай ата-анасының не заңды өкілінің қажетті келісімі барын мәлімдейді. Белгі жасты немесе өкіл өкілеттігін тексеру емес. Заңды өкіл қолжетімділік пен жою туралы иесіне жаза алады. Сұрауды растау алдымен аккаунт поштасы арқылы жасалады; бөлек негізделген сұраусыз паспорт көшірмесін жіберме. Міндетті келісім болмаса, аккаунт жасамау керек.',
      ],
      [
        'Қызмет жеткізушілер және алушылар',
        'Supabase авторизация, дерекқор және пайдаланушы жазбаларын сақтауға, Vercel қазіргі инфрақұрылымда қосымшаны орналастыруға қолданылады. Жеткізушілер қызмет көрсету үшін техникалық деректерді өңдеуі мүмкін. Команданың қолжетімділігі сүйемелдеу және сұраулармен шектеледі. Профиль каталогта жарияланбайды, университеттерге не менторларға автоматты жіберілмейді. Қазіргі нұсқада профиль сыртқы AI-провайдерге берілмейді, жарнамалық пиксельдер мен төлем өңдеу қосылмаған.',
      ],
      [
        'Орналасу және халықаралық өңдеу',
        'Жеткізушілер инфрақұрылымы Қазақстаннан тыс болуы, бұлтты функциялар трансшекаралық беруді қамтуы мүмкін. Иесі жария іске қосу немесе инфрақұрылым өзгерісі алдында нақты сақтау орнын, жеткізуші шарттарын және деректерді жергілікті сақтау талаптарын тексеруі тиіс. Саясат тек Қазақстанда сақтауға уәде бермейді. Нақты деректердің өңделу орнын білу қажет болса, тіркелмес бұрын иесіне жаз.',
      ],
      [
        'Cookies және браузер жады',
        'Кіруге қажетті сессия cookies қолданылады. Сервер тұлғаны, ал дерекқор ережелері жеке жазбаларға аккаунт иесінің қолжетімділігін тексереді. Құпиясөз браузер нобайында не профиль өрістерінде сақталмайды. Сақталмаған жауаптар ашық қойынды жадында қалады, бетті жаңарту өзгерістерді жоғалтуы мүмкін. Бұл нұсқада міндетті емес аналитика мен жарнамалық cookies қосылмаған. Қажетті cookies бұғатталса, кіру бұзылуы мүмкін.',
      ],
      [
        'Сақтау мерзімі',
        'Аккаунт, профиль, оның тарихы, тізімдер мен іріктеулер функцияларға қажет болғанша және расталған жою сұрауы орындалғанша, заңды міндетті сақтау ескеріліп сақталады. Өрісті өзгерту ескі нұсқаларды жоймайды. Техникалық журналдар мен резервтік көшірмелердің жеткізушіге байланысты бөлек баптаулары бар; бірыңғай расталған тазалау мерзімі әзірге анықталмаған. Белгілі мерзімде автоматты жою уәде етілмейді. Өзекті мерзімдер мен шектеулерді иесінен сұрауға болады.',
      ],
      [
        'Құқықтарың және өтініш тәртібі',
        'Қолданылатын құқық шегінде өңдеу туралы ақпарат, көшірме, түзету, жою, келісімді қайтарып алу және қарсылықтарды қарауды сұрай аласың. jetuu1550@gmail.com мекенжайына «JETU — дербес деректер» тақырыбымен аккаунт поштасын және сұралған әрекетті жаз. Құпиясөз бен артық құжат қоспа. Бөтен адамның аккаунтыңды жоюына жол бермеу үшін тиесілікті өлшемді растау қажет. Өтініштер заңда қолданылатын мерзімдерде қолмен қаралады; шектеулер мен міндетті сақтау түсіндіріледі.',
      ],
      [
        'Өзің жасай алатын әрекеттер',
        'Профильді тексеру және өзгерту, тексеру қадамында жауаптардың JSON көшірмесін жүктеу, жеке тізімдер мен жазбаларды өзгерту, құпиясөзді қалпына келтіру және сессиялардан шығу. Жүктелген көшірмені өзің сақтайсың; ортақ құрылғыларда қорға. Қазіргі нұсқада аккаунтты жою батырмасы жоқ. Аккаунт, профиль, тарих, сақталған нұсқалар және іріктеулерді жою үшін иесіне сұрау жібер.',
      ],
      [
        'Қорғау және шектеулер',
        'Қосымша серверде тұлғаны тексереді, жеке жазбаларға қолжетімділікті шектейді, енгізу мен профиль нұсқаларын тексереді. Сақтау қатесі болғанда сәттілік көрсетілмеуі тиіс. Абсолютті қауіпсіздік кепілдігі жоқ. Бөтен қолжетімділікке күдік болса, құпиясөзді өзгертіп, иесіне жаз. Оқиғалар мен сұраулар қолданылатын хабарлау талаптары ескеріліп қаралады.',
      ],
      [
        'Іріктеу және автоматтандырылған өңдеу',
        'Іріктеу профильді жарияланған талаптармен салыстырады және қалауға сәйкестікті бөлек есептейді. Нәтиже университет шешімі, тұлғаны бағалау, оқуға түсу ықтималдығы не стипендия кепілдігі емес. Белгісіз деректер белгісіз қалуы тиіс. Өтініш берер алдында талаптар мен мерзімдерді ресми дереккөзден тексер; қате не ескірген деректер нәтижеге әсер етуі мүмкін.',
      ],
      [
        'Саясат өзгерістері',
        'Ағымдағы нұсқа күнімен осы бетте жарияланады. Мақсаттар не өңделетін деректер елеулі өзгерсе, тиісті хабарлау және қажет болса жаңа өңдеуге дейін жаңа келісім керек. Сыртқы сайттардың өз саясаттары бар. Оларға сілтеме JETU профиліңе автоматты қолжетімділік бермейді.',
      ],
    ],
  },
};

export function PrivacyPolicy({ locale }: { locale: Locale }) {
  const t = policies[locale];
  return (
    <>
      <main id="main" tabIndex={-1} className="policy-main page-shell">
        <header className="policy-intro">
          <p className="journey-overline">JETU / PRIVACY · 2026-11-04</p>
          <h1>{marketing[locale].pages.privacy.title}</h1>
          <p>{t.intro}</p>
          <a
            className="ui-button ui-button--primary"
            href="mailto:jetuu1550@gmail.com"
          >
            {t.contact} ↗
          </a>
        </header>
        <div className="policy-summary">
          {t.summaries.map(([title, body]) => (
            <div key={title}>
              <h2>{title}</h2>
              <p>{body}</p>
            </div>
          ))}
        </div>
        <div className="policy-layout">
          <nav className="policy-toc" aria-label={t.contents}>
            {t.sections.map(([title], index) => (
              <a href={`#policy-${index + 1}`} key={title}>
                {String(index + 1).padStart(2, '0')} / {title}
              </a>
            ))}
          </nav>
          <div className="policy-content">
            {t.sections.map(([title, body], index) => (
              <section
                key={title}
                id={`policy-${index + 1}`}
                aria-labelledby={`policy-heading-${index}`}
              >
                <h2 id={`policy-heading-${index}`}>{title}</h2>
                <p>{body}</p>
              </section>
            ))}
            <address className="policy-contact">
              Мырзабек Нұржан · Қазақстан
              <br />
              <a href="mailto:jetuu1550@gmail.com">jetuu1550@gmail.com</a>
            </address>
          </div>
        </div>
      </main>
      <MarketingFooter locale={locale} />
    </>
  );
}
