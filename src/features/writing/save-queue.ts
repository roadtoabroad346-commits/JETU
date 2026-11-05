import { fromDraft, type Draft, type WritingInput } from './contracts';
import { RequestFailure } from './client';
export type SaveStatus =
  'saved' | 'unsaved' | 'saving' | 'error' | 'offline' | 'conflict';
const fingerprint = (v: WritingInput) =>
  JSON.stringify({ ...v, version: 0, requestId: '', checkpoint: false });
export class SaveQueue {
  private listeners = new Set<() => void>();
  private savedFingerprint: string;
  private pending: WritingInput | null = null;
  private running: Promise<void> | null = null;
  private snapshot: { input: WritingInput; status: SaveStatus };
  lastSavedAt = 0;
  constructor(
    input: WritingInput,
    private persist: (input: WritingInput) => Promise<Draft>,
    private acknowledged: (row: Draft) => void = () => {},
  ) {
    this.snapshot = { input, status: input.version ? 'saved' : 'unsaved' };
    this.savedFingerprint = input.version ? fingerprint(input) : '';
  }
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  getSnapshot = () => this.snapshot;
  private emit(input: WritingInput, status: SaveStatus) {
    this.snapshot = { input, status };
    this.listeners.forEach((fn) => fn());
  }
  get dirty() {
    return (
      this.pending !== null ||
      fingerprint(this.snapshot.input) !== this.savedFingerprint
    );
  }
  edit(input: WritingInput) {
    const status = this.snapshot.status;
    this.emit(
      input,
      ['error', 'conflict', 'offline'].includes(status) ? status : 'unsaved',
    );
  }
  flush = (checkpoint = false): Promise<void> => {
    if (this.running)
      return this.running.then(() =>
        checkpoint ? this.flush(true) : undefined,
      );
    if (this.snapshot.status === 'conflict') return Promise.resolve();
    if (!this.pending && !this.dirty && !checkpoint) return Promise.resolve();
    // An uncertain write is retried byte-for-byte with its original request UUID.
    const payload = this.pending ?? {
      ...this.snapshot.input,
      requestId: crypto.randomUUID(),
      checkpoint,
    };
    this.pending = payload;
    this.emit(this.snapshot.input, 'saving');
    this.running = (async () => {
      try {
        const row = await this.persist(payload);
        if (row.id !== payload.id || row.version <= payload.version)
          throw new RequestFailure('CONFLICT');
        this.savedFingerprint = fingerprint(payload);
        this.pending = null;
        this.lastSavedAt = Date.now();
        const input = { ...this.snapshot.input, version: row.version };
        this.emit(
          input,
          fingerprint(input) === this.savedFingerprint ? 'saved' : 'unsaved',
        );
        this.acknowledged(row);
      } catch (error) {
        this.emit(
          this.snapshot.input,
          error instanceof RequestFailure && error.code === 'CONFLICT'
            ? 'conflict'
            : typeof navigator !== 'undefined' && navigator.onLine === false
              ? 'offline'
              : 'error',
        );
      } finally {
        this.running = null;
      }
    })();
    return this.running;
  };
  /** Local recovery only; never write a stale copy onto the original project. */
  fork() {
    const input = {
      ...this.snapshot.input,
      id: crypto.randomUUID(),
      version: 0,
      requestId: crypto.randomUUID(),
      checkpoint: true,
    };
    return fromDraft({
      id: input.id,
      title: input.title,
      kind: input.kind,
      content: input.content,
      prompt: input.prompt,
      word_limit: input.wordLimit,
      application_id: input.applicationId,
      prompt_id: input.promptId,
      rubric: input.rubric,
      studio: input.studio,
      version: 0,
      updated_at: new Date().toISOString(),
    });
  }
}
