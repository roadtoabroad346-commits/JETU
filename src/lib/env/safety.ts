import { EnvironmentError, isAnonKey } from './public';

// Build-time protection, distinct from client-safe env parsing. Never return values in errors.
export function assertPublicEnvironmentSafety(
  env: Record<string, string | undefined>,
) {
  const unsafe = Object.entries(env)
    .filter(([name, value]) => {
      if (!name.startsWith('NEXT_PUBLIC_') || !value) return false;
      return (
        /SECRET|SERVICE_ROLE|PRIVATE|PASSWORD|DATABASE_URL|ACCESS_TOKEN/i.test(
          name,
        ) ||
        value.includes('sb_secret_') ||
        (/^eyJ[A-Za-z0-9_-]*\./.test(value) && !isAnonKey(value))
      );
    })
    .map(([name]) => name);
  if (unsafe.length) throw new EnvironmentError(unsafe);
}
