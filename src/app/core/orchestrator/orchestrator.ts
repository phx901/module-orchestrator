import { Injectable, computed, signal } from '@angular/core';
import { EMPTY, Observable, Subject } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { getDependents, getReadyModules, validateGraph } from './graph';
import { ModuleDefinition, ModuleId, ModuleState } from './module-types';
import { Result } from './result';

@Injectable({ providedIn: 'root' })
export class Orchestrator {
  private readonly _defs = signal<ModuleDefinition[]>([]);
  private readonly _states = signal<Map<ModuleId, ModuleState>>(new Map());
  private readonly _results = signal<Map<ModuleId, Result>>(new Map());
  private readonly defsById = computed(() => new Map(this._defs().map((def) => [def.id, def])));
  private readonly trigger$ = new Subject<ModuleId>();

  readonly states = this._states.asReadonly();
  readonly results = this._results.asReadonly();
  readonly defs = this._defs.asReadonly();

  readonly overallProgress = computed(() => {
    const states = [...this._states().values()];
    if (states.length === 0) {
      return 0;
    }
    const completed = states.filter((state) => state.status === 'Completed').length;
    return completed / states.length;
  });

  readonly hasFailures = computed(() =>
    [...this._states().values()].some((state) => state.status === 'Failed'),
  );

  readonly runningCount = computed(
    () => [...this._states().values()].filter((state) => state.status === 'Running').length,
  );

  constructor() {
    this.trigger$.pipe(mergeMap((id) => this.executeModule(id))).subscribe();
  }

  register(defs: ModuleDefinition[]): void {
    const errors = validateGraph(defs);
    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }
    this._defs.set(defs);
  }

  run(): void {
    const initialStates = new Map<ModuleId, ModuleState>(
      this._defs().map((def) => [def.id, { status: 'Pending' }]),
    );
    this._states.set(initialStates);
    this._results.set(new Map());
    this.checkReady();
  }

  retry(id: ModuleId): void {
    if (this._states().get(id)?.status !== 'Failed') {
      return;
    }
    this.startModule(id);
  }

  private checkReady(): void {
    for (const id of getReadyModules(this._defs(), this._states())) {
      this.startModule(id);
    }
  }

  private startModule(id: ModuleId): void {
    this.setState(id, { status: 'Running', startedAt: Date.now() });
    this.trigger$.next(id);
  }

  private executeModule(id: ModuleId): Observable<void> {
    const def = this.defsById().get(id);
    if (!def) {
      return EMPTY;
    }
    return def.execute(this.collectInputs(id)).pipe(
      tap((result) => this.onCompleted(id, result)),
      map(() => undefined),
      catchError((error: unknown) => {
        this.onFailed(id, error);
        return EMPTY;
      }),
    );
  }

  private collectInputs(id: ModuleId): Partial<Record<ModuleId, Result>> {
    const inputs: Partial<Record<ModuleId, Result>> = {};
    for (const depId of this.defsById().get(id)?.dependsOn ?? []) {
      const result = this._results().get(depId);
      if (result) {
        inputs[depId] = result;
      }
    }
    return inputs;
  }

  private onCompleted(id: ModuleId, result: Result): void {
    this._results.update((map) => new Map(map).set(id, result));
    this.setState(id, { status: 'Completed', result, finishedAt: Date.now() });
    this.unblockDependents(id);
    this.checkReady();
  }

  private onFailed(id: ModuleId, error: unknown): void {
    const result: Result = {
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
    this.setState(id, { status: 'Failed', result, finishedAt: Date.now() });
    this.blockDependents(id);
  }

  private blockDependents(id: ModuleId): void {
    for (const depId of getDependents(id, this._defs())) {
      if (this._states().get(depId)?.status === 'Pending') {
        this.setState(depId, { status: 'Blocked' });
      }
    }
  }

  private unblockDependents(id: ModuleId): void {
    for (const depId of getDependents(id, this._defs())) {
      if (this._states().get(depId)?.status === 'Blocked') {
        this.setState(depId, { status: 'Pending' });
      }
    }
  }

  private setState(id: ModuleId, patch: Partial<ModuleState>): void {
    this._states.update((map) => {
      const next = new Map(map);
      next.set(id, { ...next.get(id), ...patch } as ModuleState);
      return next;
    });
  }
}
