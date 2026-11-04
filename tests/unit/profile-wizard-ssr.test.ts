import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ProfileWizard } from '../../src/features/onboarding/profile-wizard';
import {
  EDUCATION_LEVELS,
  FIELD_NAMES,
  STEP_FIELDS,
  STUDY_LEVELS,
} from '../../src/features/onboarding/steps';

const noop = () => {};

function count(html: string, needle: string): number {
  return html.split(needle).length - 1;
}

// Radio groups render one input per option, everything else renders once.
const EXPECTED_INPUT_COUNTS: Record<string, number> = {
  studyLevel: STUDY_LEVELS.length,
  educationLevel: EDUCATION_LEVELS.length + 1,
};

describe('profile wizard SSR contract', () => {
  it('renders every server-action field exactly once with no hidden panes', () => {
    const html = renderToStaticMarkup(
      createElement(ProfileWizard, {
        locale: 'ru',
        action: noop,
        defaults: {
          country: 'Казахстан',
          studyLevel: 'bachelor',
          gpa: '3.8',
          gpaScale: '4',
        },
        loadFailed: false,
        invalid: false,
      }),
    );
    // SSR shows stacked panes: nothing may be hidden before hydration.
    expect(html).not.toContain(' hidden=""');
    expect(html).not.toContain('hidden=""');
    for (const field of FIELD_NAMES) {
      expect(count(html, `name="${field}"`), field).toBe(
        EXPECTED_INPUT_COUNTS[field] ?? 1,
      );
    }
    for (const step of STEPS_KEYS()) {
      expect(html).toContain(`id="wiz-heading-${step}"`);
    }
    // Persisted values land in the markup so no-JS users see the profile.
    expect(html).toContain('value="Казахстан"');
    expect(html).toContain('value="bachelor"');
    // Locale travels with the form to the server action.
    expect(html).toContain('name="locale"');
    // The no-JS path keeps its own visible save button.
    expect(count(html, 'type="submit"')).toBeGreaterThanOrEqual(1);
  });

  it('renders the three locales with the same field inventory', () => {
    for (const locale of ['ru', 'kk', 'en'] as const) {
      const html = renderToStaticMarkup(
        createElement(ProfileWizard, {
          locale,
          action: noop,
          defaults: {},
          loadFailed: false,
          invalid: false,
        }),
      );
      for (const field of FIELD_NAMES) {
        expect(count(html, `name="${field}"`), `${locale}:${field}`).toBe(
          EXPECTED_INPUT_COUNTS[field] ?? 1,
        );
      }
    }
  });
});

function STEPS_KEYS(): string[] {
  return Object.keys(STEP_FIELDS) as string[];
}
