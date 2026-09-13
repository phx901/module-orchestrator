import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ModuleDefinition, ModuleId } from '../module/module-definition';
import { Orchestrator } from './orchestrator';
import { Result } from '../module/result';

function makeDef(
  id: ModuleId,
  dependsOn: ModuleId[],
  options: { durationMs?: number; failWith?: string } = {},
): ModuleDefinition {
  const durationMs = options.durationMs ?? 0;
  return {
    id,
    dependsOn,
    execute: (): Observable<Result> =>
      timer(durationMs).pipe(
        switchMap(() =>
          options.failWith
            ? throwError(() => new Error(options.failWith))
            : of<Result>({ status: 'ok', value: id }),
        ),
      ),
  };
}

describe('Orchestrator', () => {
  let orchestrator: Orchestrator;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    orchestrator = TestBed.inject(Orchestrator);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs the example graph in the correct order with B/C in parallel', () => {
    const defs: ModuleDefinition[] = [
      makeDef('A', [], { durationMs: 10 }),
      makeDef('B', ['A'], { durationMs: 20 }),
      makeDef('C', ['A'], { durationMs: 10 }),
      makeDef('D', ['C'], { durationMs: 10 }),
      makeDef('E', ['B', 'D'], { durationMs: 10 }),
    ];
    orchestrator.register(defs);
    orchestrator.run();

    expect(orchestrator.states().get('A')?.status).toBe('Running');
    vi.advanceTimersByTime(10);
    expect(orchestrator.states().get('A')?.status).toBe('Completed');
    expect(orchestrator.states().get('B')?.status).toBe('Running');
    expect(orchestrator.states().get('C')?.status).toBe('Running');
    expect(orchestrator.states().get('E')?.status).toBe('Pending');

    vi.advanceTimersByTime(10);
    expect(orchestrator.states().get('B')?.status).toBe('Running');
    expect(orchestrator.states().get('C')?.status).toBe('Completed');
    expect(orchestrator.states().get('D')?.status).toBe('Running');
    expect(orchestrator.states().get('E')?.status).toBe('Pending');

    vi.advanceTimersByTime(10);
    expect(orchestrator.states().get('B')?.status).toBe('Completed');
    expect(orchestrator.states().get('D')?.status).toBe('Completed');
    expect(orchestrator.states().get('E')?.status).toBe('Running');

    vi.advanceTimersByTime(10);
    expect(orchestrator.states().get('E')?.status).toBe('Completed');
  });

  it('does not double-trigger E when B and D finish at the same time', () => {
    const defs: ModuleDefinition[] = [
      makeDef('A', [], { durationMs: 10 }),
      makeDef('B', ['A'], { durationMs: 10 }),
      makeDef('C', ['A'], { durationMs: 5 }),
      makeDef('D', ['C'], { durationMs: 5 }),
      makeDef('E', ['B', 'D'], { durationMs: 10 }),
    ];
    orchestrator.register(defs);
    orchestrator.run();

    vi.advanceTimersByTime(10);
    vi.advanceTimersByTime(10);
    expect(orchestrator.states().get('B')?.status).toBe('Completed');
    expect(orchestrator.states().get('D')?.status).toBe('Completed');
    expect(orchestrator.states().get('E')?.status).toBe('Running');
    expect(orchestrator.states().get('E')?.startedAt).toBeDefined();
  });

  it('isolates errors: blocks dependents while independent branches keep running, retry resumes the chain', () => {
    let cShouldFail = true;
    const flakyC: ModuleDefinition = {
      id: 'C',
      dependsOn: ['A'],
      execute: (): Observable<Result> =>
        timer(10).pipe(
          switchMap(() =>
            cShouldFail ? throwError(() => new Error('boom')) : of<Result>({ status: 'ok', value: 'C' }),
          ),
        ),
    };
    const defs: ModuleDefinition[] = [
      makeDef('A', [], { durationMs: 10 }),
      makeDef('B', ['A'], { durationMs: 10 }),
      flakyC,
      makeDef('D', ['C'], { durationMs: 10 }),
      makeDef('E', ['B', 'D'], { durationMs: 10 }),
    ];
    orchestrator.register(defs);
    orchestrator.run();

    vi.advanceTimersByTime(10);
    vi.advanceTimersByTime(10);

    expect(orchestrator.states().get('C')?.status).toBe('Failed');
    expect(orchestrator.states().get('D')?.status).toBe('Blocked');
    expect(orchestrator.states().get('E')?.status).toBe('Blocked');
    expect(orchestrator.states().get('B')?.status).toBe('Completed');

    cShouldFail = false;
    orchestrator.retry('C');
    expect(orchestrator.states().get('C')?.status).toBe('Running');

    vi.advanceTimersByTime(10);
    expect(orchestrator.states().get('C')?.status).toBe('Completed');
    expect(orchestrator.states().get('D')?.status).toBe('Running');

    vi.advanceTimersByTime(10);
    expect(orchestrator.states().get('D')?.status).toBe('Completed');
    expect(orchestrator.states().get('E')?.status).toBe('Running');

    vi.advanceTimersByTime(10);
    expect(orchestrator.states().get('E')?.status).toBe('Completed');
  });

  it('rejects registering an invalid graph', () => {
    const defs: ModuleDefinition[] = [makeDef('A', ['B']), makeDef('B', ['A'])];
    expect(() => orchestrator.register(defs)).toThrow();
  });
});
