import { spawnSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  writeFileSync,
  renameSync,
  unlinkSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import nextEnv from '@next/env';
import { format, resolveConfig } from 'prettier';
import { localCommand } from './db-safety.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
// Match Next's dotenv loading; an unobserved .env.local must not bypass safety checks.
nextEnv.loadEnvConfig(root, true, { info() {}, error() {} });
try {
  const args = process.argv.slice(2);
  const command = localCommand(
    args,
    process.env,
    readFileSync(path.join(root, 'supabase/config.toml'), 'utf8'),
    existsSync(path.join(root, 'supabase/.temp/project-ref')),
  );
  const localEnv = {
    ...process.env,
    DOCKER_HOST: 'unix:///var/run/docker.sock',
  };
  delete localEnv.DOCKER_CONTEXT;
  const check = spawnSync(
    'docker',
    [
      '--host=unix:///var/run/docker.sock',
      'info',
      '--format',
      '{{.ServerVersion}}',
    ],
    {
      env: localEnv,
      encoding: 'utf8',
      timeout: 15_000,
    },
  );
  if (check.status !== 0)
    throw new Error(
      'Local Docker daemon is unavailable. Start Docker before using the local Supabase stack.',
    );
  const cli = path.join(
    root,
    'node_modules/.bin',
    process.platform === 'win32' ? 'supabase.cmd' : 'supabase',
  );
  const result = spawnSync(cli, [...command, '--workdir', root], {
    cwd: root,
    env: localEnv,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  if (result.status !== 0) {
    if (args[0] === 'test') process.stdout.write(result.stdout ?? '');
    // Do not print stdout: CLI diagnostics may contain connection strings or keys.
    process.exitCode = result.status ?? 1;
    process.stderr.write(
      'Local Supabase command failed; generated types were not changed.\n',
    );
  } else if (args[0] === 'types') {
    if (!result.stdout.includes('export type Database'))
      throw new Error('CLI did not return database types.');
    const target = path.join(root, 'src/lib/supabase/database.types.ts');
    const temporary = `${target}.tmp`;
    try {
      const formatted = await format(result.stdout, {
        ...(await resolveConfig(target)),
        filepath: target,
      });
      writeFileSync(temporary, formatted, { flag: 'wx' });
      renameSync(temporary, target);
    } finally {
      if (existsSync(temporary)) unlinkSync(temporary);
    }
    process.stdout.write(
      'Generated public schema types from the local database.\n',
    );
  } else if (args[0] === 'start' || args[0] === 'start-database') {
    process.stdout.write(
      args[0] === 'start-database'
        ? 'Local Supabase PostgreSQL started. Auth, Storage, Realtime and HTTP API are excluded in database-only mode.\n'
        : 'Local Supabase started. Retrieve local development keys using the CLI status command; do not commit them.\n',
    );
  } else {
    process.stdout.write(result.stdout);
  }
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : 'Local database command failed.'}\n`,
  );
  process.exitCode = 1;
}
