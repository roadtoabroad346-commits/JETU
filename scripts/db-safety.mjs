const commands = Object.freeze({
  start: ['start'],
  'start-vault-tests': [
    'start',
    '--exclude',
    'realtime,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor',
  ],
  'start-database': [
    'start',
    '--exclude',
    'gotrue,realtime,storage-api,imgproxy,kong,mailpit,postgrest,postgres-meta,studio,edge-runtime,logflare,vector,supavisor',
  ],
  stop: ['stop', '--project-id', 'jetu-local'],
  reset: ['db', 'reset', '--local', '--yes'],
  types: [
    'gen',
    'types',
    '--local',
    '--lang',
    'typescript',
    '--schema',
    'public',
  ],
  test: ['test', 'db', '--local'],
  advisors: [
    'db',
    'advisors',
    '--local',
    '--type',
    'all',
    '--fail-on',
    'error',
  ],
  migrations: ['migration', 'list', '--local'],
});

/** Pure guard, tested without invoking Docker or a database. Never log env values. */
export function localCommand(args, env, config, linked) {
  if (args.length !== 1 || !Object.hasOwn(commands, args[0])) {
    throw new Error(
      'Use a documented local database command without extra arguments.',
    );
  }
  if (
    !['local', 'test'].includes(env.JETU_ENV ?? 'local') ||
    !['development', 'test'].includes(env.NODE_ENV ?? 'development')
  ) {
    throw new Error(
      'Local database commands refuse staging/production environments.',
    );
  }
  const remoteSelectors = [
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
  ];
  if (remoteSelectors.some((name) => Boolean(env[name])) || linked) {
    throw new Error(
      'Remote database selectors or linked project detected. Use an isolated local checkout.',
    );
  }
  if (
    (env.DOCKER_HOST &&
      ![
        'unix:///var/run/docker.sock',
        'npipe:////./pipe/docker_engine',
      ].includes(env.DOCKER_HOST)) ||
    (env.DOCKER_CONTEXT && env.DOCKER_CONTEXT !== 'default') ||
    env.DOCKER_TLS ||
    env.DOCKER_TLS_VERIFY ||
    env.DOCKER_CERT_PATH
  ) {
    throw new Error(
      'Local database commands require the local Docker socket or Windows named pipe.',
    );
  }
  if (
    !/^project_id\s*=\s*"jetu-local"\s*$/m.test(config) ||
    !/^schemas\s*=\s*\["public"\]\s*$/m.test(config) ||
    !/^auto_expose_new_tables\s*=\s*false\s*$/m.test(config)
  ) {
    throw new Error(
      'Unexpected local Supabase project or API security configuration.',
    );
  }
  return [...commands[args[0]]];
}
