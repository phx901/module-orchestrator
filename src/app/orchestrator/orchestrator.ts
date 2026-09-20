import { Injectable, computed, signal } from '@angular/core';
import { EMPTY, Observable, Subject } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { getDependents, getReadyModules } from './scheduling';
import { validateModuleGraph } from '../module/graph-validation/module-graph-validation';
import { countStatesWithStatus, hasStateWithStatus } from '../module/module-state-utils';
import { ModuleState } from '../module/module-state';
import { Module, ModuleId } from '../module/module';
import { Result } from '../module/result';

@Injectable({ providedIn: 'root' })
export class Orchestrator {
  private readonly _modules = signal<Module[]>([]);
  private readonly _statesById = signal<Map<ModuleId, ModuleState>>(new Map());
  private readonly _resultsById = signal<Map<ModuleId, Result>>(new Map());
  private readonly _modulesById = computed(
    () => new Map(this._modules().map((module) => [module.id, module])),
  );
  private readonly trigger$ = new Subject<ModuleId>();

  readonly states = this._statesById.asReadonly();
  readonly results = this._resultsById.asReadonly();
  readonly modules = this._modules.asReadonly();

  readonly overallProgress = computed(() => {
    const states = [...this._statesById().values()];
    if (states.length === 0) return 0;
    return countStatesWithStatus(states, 'Completed') / states.length;
  });

  readonly hasFailures = computed(() =>
    hasStateWithStatus([...this._statesById().values()], 'Failed'),
  );

  readonly runningCount = computed(() =>
    countStatesWithStatus([...this._statesById().values()], 'Running'),
  );

  constructor() {
    this.trigger$.pipe(mergeMap((id) => this.executeModule(id))).subscribe();
  }

  register(modules: Module[]): void {
    const errors = validateModuleGraph(modules);
    if (errors.length > 0) throw new Error(errors.join('; '));
    this._modules.set(modules);
  }

  run(): void {
    const initialStates = new Map<ModuleId, ModuleState>(
      this._modules().map((module) => [module.id, { status: 'Pending' }]),
    );
    this._statesById.set(initialStates);
    this._resultsById.set(new Map());
    this.checkReady();
  }

  retry(id: ModuleId): void {
    if (this._statesById().get(id)?.status !== 'Failed') {
      return;
    }
    this.startModule(id);
  }

  private checkReady(): void {
    for (const id of getReadyModules(this._modules(), this._statesById())) {
      this.startModule(id);
    }
  }

  private startModule(id: ModuleId): void {
    this.setState(id, { status: 'Running', startedAt: Date.now() });
    this.trigger$.next(id);
  }

  private executeModule(id: ModuleId): Observable<void> {
    const module = this._modulesById().get(id);
    if (!module) return EMPTY;
    return module.execute(this.collectInputs(id)).pipe(
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
    for (const dependencyId of this._modulesById().get(id)?.dependsOn ?? []) {
      const result = this._resultsById().get(dependencyId);
      if (result) inputs[dependencyId] = result;
    }
    return inputs;
  }

  private onCompleted(id: ModuleId, result: Result): void {
    this._resultsById.update((map) => new Map(map).set(id, result));
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
    for (const dependencyId of getDependents(id, this._modules())) {
      if (this._statesById().get(dependencyId)?.status === 'Pending') {
        this.setState(dependencyId, { status: 'Blocked' });
      }
    }
  }

  private unblockDependents(id: ModuleId): void {
    for (const dependencyId of getDependents(id, this._modules())) {
      if (this._statesById().get(dependencyId)?.status === 'Blocked') {
        this.setState(dependencyId, { status: 'Pending' });
      }
    }
  }

  private setState(id: ModuleId, patch: Partial<ModuleState>): void {
    this._statesById.update((map) => {
      const next = new Map(map);
      next.set(id, { ...next.get(id), ...patch } as ModuleState);
      return next;
    });
  }
}
