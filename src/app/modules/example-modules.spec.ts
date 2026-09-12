import { TestBed } from '@angular/core/testing';
import { Compute } from '../core/compute/compute';
import { Orchestrator } from '../core/orchestrator/orchestrator';
import { createExampleModules } from './example-modules';

describe('example modules A-E', () => {
  let orchestrator: Orchestrator;
  let compute: Compute;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    orchestrator = TestBed.inject(Orchestrator);
    compute = TestBed.inject(Compute);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('runs the full graph to completion and passes dependency results as inputs', () => {
    orchestrator.register(createExampleModules(compute));
    orchestrator.run();

    vi.advanceTimersByTime(1000);
    expect(orchestrator.states().get('A')?.status).toBe('Completed');

    vi.advanceTimersByTime(2000);
    expect(orchestrator.states().get('B')?.status).toBe('Completed');
    expect(orchestrator.states().get('C')?.status).toBe('Completed');

    vi.advanceTimersByTime(1000);
    expect(orchestrator.states().get('D')?.status).toBe('Completed');

    vi.advanceTimersByTime(1000);
    expect(orchestrator.states().get('E')?.status).toBe('Completed');

    expect(orchestrator.states().get('E')?.result?.value).toBe(
      'E-data(B-data(A-data),D-data(C-data(A-data)))',
    );
  });
});
