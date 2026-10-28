import { describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';

describe('ESLint accessibility compatibility', () => {
  it('retains accessibility enforcement with the reviewed ESLint peer override', async () => {
    const eslint = new ESLint();
    const results = await eslint.lintText(
      'export const Example = () => <><img src="test.png" /><button onClick={() => {}}>Test</button></>;',
      { filePath: 'src/lint-compatibility.tsx' },
    );
    expect(results[0]?.messages.map((message) => message.ruleId)).toContain(
      'jsx-a11y/alt-text',
    );
  });
});
