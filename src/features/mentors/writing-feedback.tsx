'use client';
import { useEffect, useState } from 'react';
import type { Locale } from '@/lib/i18n/messages';
import { requestData } from '@/features/writing/client';
import { mentorCopy, label } from './copy';
import type { Comment } from './contracts';
export function HumanFeedback({
  locale,
  draftId,
}: {
  locale: Locale;
  draftId: string;
}) {
  const t = mentorCopy[locale];
  const [feedback, setFeedback] = useState<{
      comments: Comment[];
      reviews: {
        id: string;
        request_id: string;
        summary: string;
        outcome: string;
        author_id: string;
        created_at: string;
      }[];
    } | null>(null),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    void requestData<NonNullable<typeof feedback>>(
      `/api/mentors?writing=${draftId}`,
    )
      .then((v) => {
        if (active) {
          setFeedback(v);
          setFailed(false);
        }
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [draftId]);
  return (
    <section className="mentor-panel mentor-stack">
      <h3>{t.review}</h3>
      <p>{t.versionNotice}</p>
      {failed ? (
        <p role="status">{t.unavailable}</p>
      ) : feedback ? (
        <>
          {feedback.reviews.map((v) => (
            <article key={v.id}>
              <h4>{label(t, v.outcome)}</h4>
              <p>{v.summary}</p>
              <a href={`/${locale}/mentoring?request=${v.request_id}`}>
                {t.open}
              </a>
            </article>
          ))}
          {feedback.comments
            .filter((c) => c.anchor)
            .map((c) => (
              <article key={c.id}>
                <blockquote>{c.anchor?.quote}</blockquote>
                <p>{c.body}</p>
                <p>
                  {label(t, c.disposition)} ·{' '}
                  <time>{new Date(c.created_at).toLocaleString(locale)}</time>
                </p>
                <a href={`/${locale}/mentoring?request=${c.request_id}`}>
                  {t.comments}
                </a>
              </article>
            ))}
          {feedback.comments.length === 0 && feedback.reviews.length === 0 && (
            <p>{t.noRequests}</p>
          )}
        </>
      ) : (
        <p>{t.loading}</p>
      )}
      <a className="ui-button ui-button--secondary" href={`/${locale}/mentors`}>
        {t.request}
      </a>
    </section>
  );
}
