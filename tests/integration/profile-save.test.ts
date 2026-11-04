import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  create: vi.fn(),
  getUser: vi.fn(),
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  maybeSingle: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
}));
vi.mock('@/lib/supabase/request', () => ({
  createRequestSupabaseClient: db.create,
}));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
import { saveProfile, submitProfile } from '@/app/[locale]/(dashboard)/actions';

function form(version = '3') {
  const values = {
    locale: 'en',
    version,
    country: 'Kazakhstan',
    studyLevel: 'bachelor',
    field: 'Computer Science',
    budget: '10000',
    nationality: 'KZ',
    residency: '',
    educationLevel: 'secondary',
    graduationYear: '',
    gpa: '',
    gpaScale: '',
    ielts: '',
    toefl: '',
    hsk: '',
    topik: '',
    sat: '',
    act: '',
  };
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}
beforeEach(() => {
  vi.clearAllMocks();
  db.create.mockResolvedValue({ auth: { getUser: db.getUser }, from: db.from });
  db.getUser.mockResolvedValue({ data: { user: { id: 'owner' } } });
  const query = {
    select: db.select,
    eq: db.eq,
    maybeSingle: db.maybeSingle,
    update: db.update,
    insert: db.insert,
  };
  for (const mock of [db.from, db.select, db.eq, db.update, db.insert])
    mock.mockReturnValue(query);
});

describe('profile concurrency (mocked adapter, not hosted persistence)', () => {
  it('rejects a stale tab before writing', async () => {
    db.maybeSingle.mockResolvedValueOnce({
      data: { version: 4, document: {} },
      error: null,
    });
    await expect(saveProfile(form('3'))).rejects.toThrow(
      'redirect:/en/onboarding?error=conflict',
    );
    expect(db.update).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });
  it('preserves independent fields and scopes an update to owner and expected version', async () => {
    db.maybeSingle
      .mockResolvedValueOnce({
        data: {
          version: 3,
          document: {
            languages: ['kk'],
            independent: 'preserved',
            grade: '11',
          },
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: { version: 4 }, error: null });
    await expect(saveProfile(form())).rejects.toThrow(
      'redirect:/en/onboarding?success=saved',
    );
    expect(db.eq).toHaveBeenCalledWith('user_id', 'owner');
    expect(db.eq).toHaveBeenCalledWith('version', 3);
    expect(db.update).toHaveBeenCalledWith(
      expect.objectContaining({
        version: 4,
        document: expect.objectContaining({
          languages: ['kk'],
          independent: 'preserved',
          grade: '11',
        }),
      }),
    );
  });
  it('does not report success if a concurrent write wins after the read', async () => {
    db.maybeSingle
      .mockResolvedValueOnce({
        data: { version: 3, document: {} },
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null });
    await expect(saveProfile(form())).rejects.toThrow(
      'redirect:/en/onboarding?error=conflict',
    );
  });
  it('never overwrites a concurrently created first profile', async () => {
    db.maybeSingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: { code: '23505' } });
    await expect(saveProfile(form('0'))).rejects.toThrow(
      'redirect:/en/onboarding?error=conflict',
    );
    expect(db.insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'owner', version: 1 }),
    );
    expect(db.update).not.toHaveBeenCalled();
  });
  it('does not write when unauthenticated or the profile cannot be read', async () => {
    db.getUser.mockResolvedValueOnce({ data: { user: null } });
    await expect(saveProfile(form())).rejects.toThrow('redirect:/en/login');
    db.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { status: 503 },
    });
    expect(await submitProfile({ status: 'idle' }, form())).toEqual({
      status: 'error',
      error: 'unavailable',
    });
    db.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'unavailable' },
    });
    await expect(saveProfile(form())).rejects.toThrow(
      'redirect:/en/onboarding?error=invalid',
    );
    expect(db.update).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });
});
