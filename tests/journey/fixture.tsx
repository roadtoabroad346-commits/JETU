import { MentorDirectory } from '../../src/features/mentors/directory';
import { MentorWorkspace } from '../../src/features/mentors/workspace';
import { HumanFeedback } from '../../src/features/mentors/writing-feedback';
import { useState } from 'react';
import { WritingWorkspace } from '../../src/features/writing/workspace';
import { createRoot } from 'react-dom/client';
import { ProfileJourney } from '../../src/features/onboarding/profile-journey';
import {
  profileFormValues,
  type ProfileSaveState,
} from '../../src/features/onboarding/model';
import { AccountExperience } from '../../src/features/onboarding/account-experience';
import type { Locale } from '../../src/lib/i18n/messages';
import '../../src/app/globals.css';

// Test-only fixture outside app routes. It never authenticates or accesses a database.
const params = new URLSearchParams(location.search);
const locale = (params.get('locale') ?? 'en') as Locale;
document.documentElement.lang = locale;
let saves = 0;
const action = async (
  _previous: ProfileSaveState,
  data: FormData,
): Promise<ProfileSaveState> => {
  saves++;
  const response = await fetch('/test-save', {
    method: 'POST',
    body: JSON.stringify(Object.fromEntries(data)),
  });
  if (!response.ok)
    return {
      status: 'error',
      error: response.status === 409 ? 'conflict' : 'unavailable',
    };
  return { status: 'saved', version: saves };
};
const initial =
  params.get('filled') === '1'
    ? {
        country: 'Kazakhstan',
        studyLevel: 'bachelor',
        field: 'Computer Science',
      }
    : {};
function FeedbackFixture() {
  const [draft, setDraft] = useState('draft-a');
  return (
    <main>
      <h1>Feedback isolation fixture</h1>
      <h2>Selected draft: {draft}</h2>
      <button onClick={() => setDraft('draft-a')}>Open A</button>
      <button onClick={() => setDraft('draft-b')}>Open B</button>
      <HumanFeedback locale={locale} draftId={draft} />
    </main>
  );
}
createRoot(document.getElementById('root')!).render(
  params.get('humanFeedback') === '1' ? (
    <FeedbackFixture />
  ) : params.get('mentors') === '1' ? (
    <main className="page-shell mentor-main">
      <MentorDirectory locale={locale} query={params.get('query') ?? ''} />
    </main>
  ) : params.get('mentoring') === '1' ? (
    <main className="page-shell dashboard-main">
      <MentorWorkspace locale={locale} query={params.get('query') ?? ''} />
    </main>
  ) : params.get('writing') === '1' ? (
    <main className="dashboard-main page-shell">
      <WritingWorkspace locale={locale} />
    </main>
  ) : params.get('account') === '1' ? (
    <AccountExperience
      locale={locale}
      mode="signup"
      action={async () => ({ status: 'check-email' })}
    />
  ) : (
    <ProfileJourney
      locale={locale}
      initial={profileFormValues(initial)}
      version={0}
      action={action}
    />
  ),
);
