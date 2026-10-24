import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { localCommand } from '../../scripts/db-safety.mjs';

const config = readFileSync(
  new URL('../../supabase/config.toml', import.meta.url),
  'utf8',
);
describe('local-only database safety', () => {
  it('pins reset to local without exposing a URL selector', () => {
    expect(localCommand(['reset'], {}, config, false)).toEqual([
      'db',
      'reset',
      '--local',
      '--yes',
    ]);
  });
  it.each([
    ['reset', '--linked'],
    ['reset', '--db-url', 'postgres://remote'],
    ['types', '--project-id', 'prod'],
    ['constructor'],
    ['__proto__'],
    [],
    ['push'],
  ])('rejects unsupported arguments %j', (...args) => {
    expect(() => localCommand(args, {}, config, false)).toThrow();
  });
  it.each([
    'DATABASE_URL',
    'SUPABASE_DB_URL',
    'SUPABASE_PROJECT_ID',
    'SUPABASE_PROJECT_REF',
    'SUPABASE_ACCESS_TOKEN',
    'PGHOST',
    'PGSERVICE',
    'PGPORT',
    'PGDATABASE',
    'PGUSER',
    'PGPASSWORD',
    'PGSERVICEFILE',
  ])('rejects remote selector %s before execution', (name) => {
    expect(() =>
      localCommand(['reset'], { [name]: 'do-not-log-me' }, config, false),
    ).toThrow('Remote database selectors');
  });
  it.each([
    { JETU_ENV: 'production' },
    { JETU_ENV: 'staging' },
    { NODE_ENV: 'production' },
    { DOCKER_HOST: 'tcp://remote:2375' },
    { DOCKER_CONTEXT: 'production' },
    { DOCKER_TLS_VERIFY: '1' },
  ])('rejects unsafe environment %j', (env) => {
    expect(() => localCommand(['reset'], env, config, false)).toThrow();
  });
  it('rejects linked checkouts and modified project/security identity', () => {
    expect(() => localCommand(['reset'], {}, config, true)).toThrow();
    expect(() =>
      localCommand(
        ['reset'],
        {},
        config.replace('jetu-local', 'production'),
        false,
      ),
    ).toThrow();
    expect(() =>
      localCommand(
        ['reset'],
        {},
        config.replace(
          'auto_expose_new_tables = false',
          'auto_expose_new_tables = true',
        ),
        false,
      ),
    ).toThrow();
  });
});
