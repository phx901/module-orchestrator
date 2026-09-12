import { TestBed } from '@angular/core/testing';
import { Compute } from './compute';

describe('Compute', () => {
  let compute: Compute;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    compute = TestBed.inject(Compute);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits the configured result after the configured duration', () => {
    const result = { status: 'ok' as const, value: 42 };
    let emitted: unknown;

    compute.run({ durationMs: 1000, result }).subscribe((value) => (emitted = value));

    expect(emitted).toBeUndefined();
    vi.advanceTimersByTime(999);
    expect(emitted).toBeUndefined();
    vi.advanceTimersByTime(1);
    expect(emitted).toEqual(result);
  });

  it('supports different durations per module', () => {
    const fast = { status: 'ok' as const };
    const slow = { status: 'ok' as const };
    let fastEmitted: unknown;
    let slowEmitted: unknown;

    compute.run({ durationMs: 100, result: fast }).subscribe((value) => (fastEmitted = value));
    compute.run({ durationMs: 500, result: slow }).subscribe((value) => (slowEmitted = value));

    vi.advanceTimersByTime(100);
    expect(fastEmitted).toEqual(fast);
    expect(slowEmitted).toBeUndefined();

    vi.advanceTimersByTime(400);
    expect(slowEmitted).toEqual(slow);
  });

  it('errors when failWith is configured', () => {
    let error: unknown;

    compute.run({ durationMs: 100, result: { status: 'ok' }, failWith: 'boom' }).subscribe({
      error: (err) => (error = err),
    });

    vi.advanceTimersByTime(100);
    expect((error as Error).message).toBe('boom');
  });
});
