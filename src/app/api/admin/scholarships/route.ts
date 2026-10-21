import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const source = z.object({
  url: z.url().startsWith('https://').max(2000),
  title: z.string().trim().min(2).max(500),
  publisher: z.string().trim().min(2).max(240),
  excerpt: z.string().trim().min(10).max(4000),
  locale: z
    .string()
    .regex(/^[a-z]{2,3}(?:-[A-Z]{2})?$/)
    .default('en'),
  checked_at: z.iso.datetime({ offset: true }).optional(),
});
const draft = z.object({
  action: z.enum(['preview', 'create']),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(160),
  title: z.string().trim().min(2).max(300),
  provider_name: z.string().trim().min(2).max(240),
  provider_country_code: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional(),
  award_type: z
    .enum([
      'scholarship',
      'grant',
      'fellowship',
      'bursary',
      'waiver',
      'assistantship',
      'other',
    ])
    .default('scholarship'),
  official_url: z.url().startsWith('https://').max(2000),
  source,
});
const transition = z.object({
  action: z.enum([
    'reviewed',
    'published',
    'unpublished',
    'archived',
    'reverified',
  ]),
  id: z.coerce.number().int().positive(),
  note: z.string().trim().max(4000).optional(),
});

async function authorization() {
  const jar = await cookies();
  const userClient = createServerSupabaseClient({
    getAll: () => jar.getAll(),
    setAll: (items) =>
      items.forEach(({ name, value, options }) =>
        jar.set(name, value, options),
      ),
  });
  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();
  if (error || !user) return null;
  const role = await userClient
    .from('scholarship_editor_memberships')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();
  if (role.error || !role.data) return null;
  return { role: role.data.role, client: userClient };
}

const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET() {
  try {
    const actor = await authorization();
    if (!actor) return json({ error: 'Unauthorized' }, 401);
    const { data, error } = await actor.client.rpc('scholarship_editor_list');
    if (error) return json({ error: 'Catalog unavailable' }, 503);
    return json({ data });
  } catch {
    return json({ error: 'Catalog unavailable' }, 503);
  }
}
export async function POST(request: Request) {
  try {
    if (request.headers.get('origin') !== new URL(request.url).origin)
      return json({ error: 'Cross-origin request rejected' }, 403);
    if (!request.headers.get('content-type')?.startsWith('application/json'))
      return json({ error: 'JSON body required' }, 415);
    const actor = await authorization();
    if (!actor) return json({ error: 'Unauthorized' }, 401);
    const body = await request.json();
    const action = body?.action;
    if (action === 'preview' || action === 'create') {
      const parsed = draft.safeParse(body);
      if (!parsed.success)
        return json({ error: 'Invalid scholarship draft' }, 400);
      const existing = await actor.client.rpc('scholarship_editor_preview', {
        p_slug: parsed.data.slug,
      });
      if (existing.error) return json({ error: 'Catalog unavailable' }, 503);
      if (parsed.data.action === 'preview')
        return json({ duplicate: existing.data, ready: !existing.data });
      if (existing.data)
        return json({ error: 'Duplicate scholarship slug' }, 409);
      const { action: _action, ...bundle } = parsed.data;
      void _action;
      const created = await actor.client.rpc(
        'scholarship_editor_create_draft',
        {
          p_bundle: bundle,
        },
      );
      if (created.error)
        return json({ error: 'Draft rejected by catalog constraints' }, 422);
      return json({ id: created.data, status: 'draft' }, 201);
    }
    const parsed = transition.safeParse(body);
    if (!parsed.success) return json({ error: 'Invalid transition' }, 400);
    if (actor.role === 'editor')
      return json({ error: 'Reviewer role required' }, 403);
    if (
      ['reviewed', 'reverified'].includes(parsed.data.action) &&
      (!parsed.data.note || parsed.data.note.length < 10)
    )
      return json({ error: 'A dated review note is required' }, 400);
    const changed = await actor.client.rpc('scholarship_editor_transition', {
      p_id: parsed.data.id,
      p_action: parsed.data.action,
      p_note: parsed.data.note,
    });
    if (changed.error)
      return json({ error: 'Transition rejected by catalog constraints' }, 422);
    return json({ id: changed.data, action: parsed.data.action });
  } catch {
    return json({ error: 'Catalog unavailable' }, 503);
  }
}
