'use client';
import { useState } from 'react';
import type { Locale } from '@/lib/i18n/messages';
import type { WritingInput } from './contracts';
import { writingCopy } from './copy';
const questions: Record<Locale, Record<string, string[]>> = {
  en: {
    motivation: [
      'Why does this subject matter to you? Use an experience you actually had.',
      'What do you hope to learn, and why?',
      'What would you contribute to a learning community?',
    ],
    academic: [
      'Describe a difficult concept you worked to understand.',
      'How did you evaluate evidence in a project?',
      'What question would you like to investigate next?',
    ],
    activities: [
      'Describe your own role in an activity.',
      'Tell us about a setback and your response.',
      'What did your contribution change? Avoid invented metrics.',
    ],
    scholarship: [
      'How would this opportunity support your stated goals?',
      'Describe an impact you can substantiate.',
      'How would you use what you learn to support others?',
    ],
    reasoning: [
      'Two important tasks have the same deadline. How would you decide what to do?',
      'What evidence would change your view?',
      'How would you approach a problem you cannot yet solve?',
    ],
  },
  ru: {
    motivation: [
      'Почему вам важна эта область? Приведите пример из своего опыта.',
      'Чему вы хотите научиться и почему?',
      'Что вы привнесёте в учебное сообщество?',
    ],
    academic: [
      'Расскажите о сложной теме, которую вы старались понять.',
      'Как вы оценивали доказательства в своём проекте?',
      'Какой вопрос вы хотите исследовать дальше?',
    ],
    activities: [
      'Опишите свою роль в одной активности.',
      'Расскажите о неудаче и своей реакции.',
      'Что изменил ваш вклад? Не выдумывайте показатели.',
    ],
    scholarship: [
      'Как эта возможность поможет вашим целям?',
      'Опишите результат, который можете подтвердить.',
      'Как вы примените знания, чтобы помочь другим?',
    ],
    reasoning: [
      'У двух важных задач один дедлайн. Как вы расставите приоритеты?',
      'Какие доказательства могли бы изменить ваше мнение?',
      'Как вы подойдёте к задаче, которую пока не умеете решать?',
    ],
  },
  kk: {
    motivation: [
      'Бұл сала сізге неге маңызды? Өз тәжірибеңізден мысал келтіріңіз.',
      'Нені үйренгіңіз келеді және неге?',
      'Оқу қауымдастығына қандай үлес қосасыз?',
    ],
    academic: [
      'Түсінуге тырысқан күрделі тақырып туралы айтыңыз.',
      'Жобаңызда дәлелдерді қалай бағаладыңыз?',
      'Келесі қандай сұрақты зерттегіңіз келеді?',
    ],
    activities: [
      'Бір іс-шарадағы өз рөліңізді сипаттаңыз.',
      'Сәтсіздік және оған жауабыңыз туралы айтыңыз.',
      'Сіздің үлесіңіз нені өзгертті? Көрсеткіштерді ойдан қоспаңыз.',
    ],
    scholarship: [
      'Бұл мүмкіндік мақсаттарыңызға қалай көмектеседі?',
      'Растай алатын нәтижеңізді сипаттаңыз.',
      'Білгеніңізді басқаларға көмектесу үшін қалай қолданасыз?',
    ],
    reasoning: [
      'Екі маңызды тапсырманың мерзімі бірдей. Басымдықты қалай белгілейсіз?',
      'Қандай дәлел пікіріңізді өзгертер еді?',
      'Әлі шеше алмайтын мәселеге қалай кірісесіз?',
    ],
  },
};
export function InterviewControls({
  locale,
  input,
  onChange,
  onPhaseChange,
}: {
  locale: Locale;
  input: WritingInput;
  onChange: (v: WritingInput) => void;
  onPhaseChange: (phase: 'idle' | 'active' | 'paused' | 'ended') => void;
}) {
  const t = writingCopy[locale];
  const [phase, setPhase] = useState<'idle' | 'active' | 'paused' | 'ended'>(
    'idle',
  );
  const [scenario, setScenario] = useState(
    input.studio.interview?.scenario ?? 'motivation',
  );
  const [question, setQuestion] = useState(
    input.studio.interview?.question ?? 0,
  );
  const [remember, setRemember] = useState(Boolean(input.studio.interview));
  const list = questions[locale][scenario]!;
  const [answers, setAnswers] = useState<string[]>(
    input.studio.interview?.answers ?? ['', '', ''],
  );
  function phaseChange(next: 'idle' | 'active' | 'paused' | 'ended') {
    setPhase(next);
    onPhaseChange(next);
  }
  function sync(nextQuestion = question) {
    const updated = [...(input.studio.interview?.answers ?? answers)];
    updated[question] = input.content;
    setAnswers(updated);
    onChange({
      ...input,
      prompt: list[nextQuestion]!,
      content: updated[nextQuestion] ?? '',
      studio: {
        ...input.studio,
        interview: remember
          ? {
              scenario,
              question: nextQuestion,
              remember: true,
              answers: updated,
            }
          : undefined,
        ready: false,
      },
    });
  }
  return (
    <section className="studio-subpanel" aria-label={t.interview}>
      <p>{t.generalPractice}</p>
      <p>{t.practicePrivacy}</p>
      <label>
        {t.scenario}
        <select
          value={scenario}
          disabled={
            phase === 'active' || phase === 'paused' || input.version > 0
          }
          onChange={(e) => setScenario(e.target.value as typeof scenario)}
        >
          {(
            [
              'motivation',
              'academic',
              'activities',
              'scholarship',
              'reasoning',
            ] as const
          ).map((key) => (
            <option value={key} key={key}>
              {
                {
                  en: {
                    motivation: 'Motivation',
                    academic: 'Academic',
                    activities: 'Activities',
                    scholarship: 'Scholarship',
                    reasoning: 'Reasoning',
                  },
                  ru: {
                    motivation: 'Мотивация',
                    academic: 'Учёба',
                    activities: 'Активности',
                    scholarship: 'Стипендия',
                    reasoning: 'Рассуждение',
                  },
                  kk: {
                    motivation: 'Уәж',
                    academic: 'Оқу',
                    activities: 'Белсенділік',
                    scholarship: 'Стипендия',
                    reasoning: 'Пайымдау',
                  },
                }[locale][key]
              }
            </option>
          ))}
        </select>
      </label>
      <label className="studio-check">
        <input
          type="checkbox"
          checked={remember}
          disabled={input.version > 0 || phase !== 'idle'}
          onChange={(e) => setRemember(e.target.checked)}
        />
        {t.remember}
      </label>
      {phase === 'idle' ? (
        <button
          type="button"
          className="ui-button ui-button--primary"
          onClick={() => {
            phaseChange('active');
            sync();
          }}
        >
          {t.startPractice}
        </button>
      ) : (
        <>
          <p className="studio-question">
            {question + 1} / 3 · {list[question]}
          </p>
          <div className="studio-actions">
            <button
              type="button"
              className="ui-button ui-button--secondary"
              disabled={phase === 'ended'}
              onClick={() =>
                phaseChange(phase === 'paused' ? 'active' : 'paused')
              }
            >
              {phase === 'paused' ? t.resume : t.pause}
            </button>
            <button
              type="button"
              className="ui-button ui-button--secondary"
              disabled={phase !== 'active' || question >= 2}
              onClick={() => {
                const next = question + 1;
                setQuestion(next);
                sync(next);
              }}
            >
              {t.next}
            </button>
            <button
              type="button"
              className="ui-button ui-button--secondary"
              disabled={phase === 'ended'}
              onClick={() => phaseChange('ended')}
            >
              {t.finish}
            </button>
          </div>
          {phase === 'paused' && <p role="status">{t.paused}</p>}
          {phase === 'ended' && <p role="status">{t.finished}</p>}
        </>
      )}
    </section>
  );
}
